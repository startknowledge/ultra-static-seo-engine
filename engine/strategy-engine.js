import axios from 'axios';
import { CONFIG } from '../config.js';
import { readJson, writeJson, retry } from './utils.js';

const KEYWORD_DB = './data/keywords.json';

// Round‑robin API config (same as before)
const API_CONFIG = [
  { key: process.env.GEMINI_API_KEY4, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GEMINI_API_KEY3, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GEMINI_API_KEY2, type: 'gemini', model: 'gemini-2.0-flash' },
  { key: process.env.GEMINI_API_KEY1, type: 'gemini', model: 'gemini-2.0-flash' },  
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

// --- Generic AI content generator (used by both strategy and blog content) ---
export async function generateAIContent(prompt) {
  for (let attempt = 0; attempt < API_CONFIG.length * 2; attempt++) {
    const api = getNextAPI();
    if (!api) break;
    try {
      let result = null;
      if (api.type === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1/models/${api.model}:generateContent?key=${api.key}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
        });
        result = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (api.type === 'groq') {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: api.model,
          messages: [{ role: 'user', content: prompt }],
        }, {
          headers: { Authorization: `Bearer ${api.key}` },
        });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'openrouter') {
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: api.model,
          messages: [{ role: 'user', content: prompt }],
        }, {
          headers: { Authorization: `Bearer ${api.key}` },
        });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'huggingface') {
        const res = await axios.post(`https://api-inference.huggingface.co/models/${api.model}`, {
          inputs: prompt,
        }, {
          headers: { Authorization: `Bearer ${api.key}` },
        });
        result = res.data?.[0]?.generated_text;
      }

      if (result && result.length > 100) {
        console.log(`✅ AI generated content using ${api.type}`);
        return result.trim();
      }
    } catch (err) {
      console.warn(`⚠️ API ${api.type} failed:`, err.message);
    }
  }
  console.error('❌ All AI providers failed to generate content.');
  return null;
}

// --- Google Trends (as before) ---
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

// --- Keyword generation helper (using AI) ---
async function generateKeywordsViaAPI(api, seed) {
  const prompt = `Generate 10 SEO keywords related to "${seed}". Return only a list, one per line, no numbers or extra text.`;
  if (api.type === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1/models/${api.model}:generateContent?key=${api.key}`;
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
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

function cleanKeywords(text) {
  if (!text) return [];
  return text.split('\n')
    .map(line => line.replace(/^\d+[).-]\s*/, '').trim())
    .filter(k => k.length > 2)
    .slice(0, 10);
}

// --- Main strategy export ---
export async function runStrategy(repoName) {
  console.log(`🧠 Generating keywords for repo: ${repoName}`);

  let allKeywords = readJson(KEYWORD_DB, {});

  let seed = await getTrendingKeyword();
  if (!seed) seed = repoName.replace(/[^a-z0-9]/gi, ' ').trim();
  console.log(`🌐 Seed keyword: ${seed}`);

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

  if (newKeywords.length === 0) {
    console.warn('⚠️ No keywords generated, using seed fallback');
    newKeywords = [seed];
  }

  if (!allKeywords[repoName]) allKeywords[repoName] = [];
  const existing = new Set(allKeywords[repoName]);
  for (const kw of newKeywords) {
    if (!existing.has(kw)) allKeywords[repoName].push(kw);
  }
  writeJson(KEYWORD_DB, allKeywords);

  const cluster = allKeywords[repoName].slice(-CONFIG.BLOGS_PER_REPO);
  return {
    niche: seed,
    cluster,
  };
}