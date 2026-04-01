import axios from 'axios';
import { CONFIG } from '../config.js';
import { readJson, writeJson, retry } from './utils.js';

const KEYWORD_DB = './data/keywords.json';

// Round‑robin API config
const API_CONFIG = [
  { key: process.env.GEMINI_API_KEY1, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GEMINI_API_KEY2, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GEMINI_API_KEY3, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GEMINI_API_KEY4, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GROQ_API1, type: 'groq', model: 'mixtral-8x7b-32768' },
  { key: process.env.OPENAI_OPENROUTER1, type: 'openrouter', model: 'openai/gpt-4o-mini' },
  { key: process.env.HUGGINGFACE_TOKEN1, type: 'huggingface', model: 'mistralai/Mistral-7B-Instruct' },
].filter(api => api.key);

let apiIndex = 0;
function getNextAPI() {
  if (API_CONFIG.length === 0) return null;
  const api = API_CONFIG[apiIndex % API_CONFIG.length];
  apiIndex++;
  return api;
}

// Google Trends (simple RSS)
async function getTrendingKeyword() {
  try {
    const res = await axios.get('https://trends.google.com/trending/rss?geo=IN');
    const xml = res.data;
    const matches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];
    const titles = matches.map(m => m[1]).filter(t => t && t !== 'Daily Search Trends');
    if (titles.length) return titles[Math.floor(Math.random() * titles.length)];
  } catch (err) {
    console.warn('⚠️ Failed to fetch trends:', err.message);
  }
  return null;
}

// Generate keywords using selected API
async function generateKeywordsViaAPI(api, seed) {
  const prompt = `Generate 10 SEO keywords related to "${seed}". Return only a list, one per line, no numbers or extra text.`;

  if (api.type === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1/models/${api.model}:generateContent?key=${api.key}`;
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text;
  }

  if (api.type === 'groq') {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: api.model,
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: { Authorization: `Bearer ${api.key}` },
    });
    return res.data?.choices?.[0]?.message?.content;
  }

  if (api.type === 'openrouter') {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: api.model,
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: { Authorization: `Bearer ${api.key}` },
    });
    return res.data?.choices?.[0]?.message?.content;
  }

  if (api.type === 'huggingface') {
    const res = await axios.post(`https://api-inference.huggingface.co/models/${api.model}`, {
      inputs: prompt,
    }, {
      headers: { Authorization: `Bearer ${api.key}` },
    });
    return res.data?.[0]?.generated_text;
  }

  return null;
}

// Clean keywords from AI output
function cleanKeywords(text) {
  if (!text) return [];
  const lines = text.split('\n');
  return lines
    .map(line => line.replace(/^\d+[).-]\s*/, '').trim())
    .filter(k => k.length > 2)
    .slice(0, 10);
}

// Main strategy: get seed (trend or repo name) and generate cluster
export async function runStrategy(repoName) {
  console.log(`🧠 Generating keywords for repo: ${repoName}`);

  // 1. Load existing keywords
  let allKeywords = readJson(KEYWORD_DB, {});

  // 2. Get seed
  let seed = await getTrendingKeyword();
  if (!seed) seed = repoName.replace(/[^a-z0-9]/gi, ' ').trim();
  console.log(`🌐 Seed keyword: ${seed}`);

  // 3. Try APIs to generate keywords
  let newKeywords = [];
  for (let attempt = 0; attempt < API_CONFIG.length * 2; attempt++) {
    const api = getNextAPI();
    if (!api) break;
    try {
      const raw = await generateKeywordsViaAPI(api, seed);
      const cleaned = cleanKeywords(raw);
      if (cleaned.length) {
        newKeywords = cleaned;
        break;
      }
    } catch (err) {
      console.warn(`API ${api.type} failed:`, err.message);
    }
  }

  // Fallback: use seed itself
  if (newKeywords.length === 0) {
    console.warn('⚠️ No keywords generated, using seed fallback');
    newKeywords = [seed];
  }

  // 4. Update global DB
  if (!allKeywords[repoName]) allKeywords[repoName] = [];
  const existing = new Set(allKeywords[repoName]);
  for (const kw of newKeywords) {
    if (!existing.has(kw)) allKeywords[repoName].push(kw);
  }
  writeJson(KEYWORD_DB, allKeywords);

  // Return the cluster (take only BLOGS_PER_REPO)
  const cluster = allKeywords[repoName].slice(-CONFIG.BLOGS_PER_REPO);
  return {
    niche: seed,
    cluster,
  };
}