import axios from 'axios';
import { CONFIG } from '../config.js';
import { readJson, writeJson, delay, retry } from './utils.js';
import { getCombinedTrends } from './trend-engine.js'; // <-- import the working trends function

const KEYWORD_DB = './data/keywords.json';
const AI_CACHE = new Map();

// Build API list from environment variables (all your keys)
const API_CONFIG = [
  ...['GEMINI_API_KEY1','GEMINI_API_KEY2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'gemini', model: 'gemini-2.0-flash', rpm: 60 })),
  ...['GROQ_API_KEY1','GROQ_API_KEY2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'groq', model: 'llama-3.3-70b-versatile', rpm: 30 })),
  ...['OPENAI_OPENROUTER1','OPENAI_OPENROUTER2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'openrouter', model: 'openai/gpt-4o-mini', rpm: 30 })),
  ...['HUGGINGFACE_TOKEN1','HUGGINGFACE_TOKEN2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'huggingface', model: 'mistralai/Mistral-7B-Instruct-v0.3', rpm: 30 })),
  ...['MISTRAL_API_KEY1','MISTRAL_API_KEY2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'mistral', model: 'mistral-large-latest', rpm: 30 })),
].filter(api => api.key);

console.log(`🔑 Loaded ${API_CONFIG.length} API keys`);

// Per‑key rate limit state
const keyState = new Map();
API_CONFIG.forEach(api => {
  keyState.set(api, { used: 0, resetTime: Date.now(), rpm: api.rpm });
});

function canUseKey(api) {
  const state = keyState.get(api);
  if (!state) return false;
  const now = Date.now();
  if (now - state.resetTime >= 60000) {
    state.used = 0;
    state.resetTime = now;
  }
  return state.used < state.rpm;
}

function markUsed(api) {
  const state = keyState.get(api);
  if (state) state.used++;
}

let apiIndex = 0;
function getNextAvailableKey() {
  for (let i = 0; i < API_CONFIG.length * 2; i++) {
    const api = API_CONFIG[apiIndex % API_CONFIG.length];
    apiIndex++;
    if (canUseKey(api)) return api;
  }
  return null;
}

// Generic AI content generator (with cache)
export async function generateAIContent(prompt, forceFresh = false) {
  const cacheKey = prompt.slice(0, 200);
  if (!forceFresh && AI_CACHE.has(cacheKey)) {
    console.log("📦 Cache hit");
    return AI_CACHE.get(cacheKey);
  }

  for (let attempt = 0; attempt < API_CONFIG.length * 3; attempt++) {
    const api = getNextAvailableKey();
    if (!api) {
      console.warn('⏳ No available key – waiting 60s');
      await delay(60000);
      continue;
    }

    try {
      let result = null;
      if (api.type === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1/models/${api.model}:generateContent?key=${api.key}`;
        const res = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
        result = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (api.type === 'groq') {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: api.model, messages: [{ role: 'user', content: prompt }]
        }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'openrouter') {
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: api.model, messages: [{ role: 'user', content: prompt }]
        }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'huggingface') {
        const url = `https://api-inference.huggingface.co/models/${api.model}`;
        const res = await axios.post(url, { inputs: prompt }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.[0]?.generated_text;
      } else if (api.type === 'mistral') {
        const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
          model: api.model, messages: [{ role: 'user', content: prompt }]
        }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.choices?.[0]?.message?.content;
      }

      if (result && result.length > 100) {
        markUsed(api);
        const cleaned = result.trim();
        AI_CACHE.set(cacheKey, cleaned);
        console.log(`✅ AI using ${api.type} (used ${keyState.get(api).used}/${api.rpm} per min)`);
        return cleaned;
      }
    } catch (err) {
      console.warn(`⚠️ ${api.type} failed: ${err.message}`);
      if (err.response?.status === 429) {
        keyState.set(api, { used: 999, resetTime: Date.now(), rpm: api.rpm });
        await delay(60000);
      }
    }
    await delay(1000);
  }

  console.error('❌ All AI providers failed – returning null');
  return null;
}

// Keyword generation using the same API rotation (works for all types)
async function generateKeywordsViaAPI(api, seed) {
  const prompt = `Generate 10 SEO keywords related to "${seed}". Return only a list, one per line, no numbers.`;
  if (api.type === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1/models/${api.model}:generateContent?key=${api.key}`;
    const res = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (api.type === 'groq') {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: api.model, messages: [{ role: 'user', content: prompt }]
    }, { headers: { Authorization: `Bearer ${api.key}` } });
    return res.data?.choices?.[0]?.message?.content;
  } else if (api.type === 'openrouter') {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: api.model, messages: [{ role: 'user', content: prompt }]
    }, { headers: { Authorization: `Bearer ${api.key}` } });
    return res.data?.choices?.[0]?.message?.content;
  } else if (api.type === 'huggingface') {
    const url = `https://api-inference.huggingface.co/models/${api.model}`;
    const res = await axios.post(url, { inputs: prompt }, { headers: { Authorization: `Bearer ${api.key}` } });
    return res.data?.[0]?.generated_text;
  } else if (api.type === 'mistral') {
    const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: api.model, messages: [{ role: 'user', content: prompt }]
    }, { headers: { Authorization: `Bearer ${api.key}` } });
    return res.data?.choices?.[0]?.message?.content;
  }
  return null;
}

function cleanKeywords(text) {
  if (!text) return [];
  return text.split('\n')
    .map(l => l.replace(/^\d+[).-]\s*/, '').trim())
    .filter(k => k.length > 2)
    .slice(0, 10);
}

// Use the reliable combined trends (with fallback) as the seed source
async function getTrendingKeyword() {
  try {
    const trends = await getCombinedTrends(); // this already includes fallback static list
    if (trends && trends.length) {
      const selected = trends[Math.floor(Math.random() * trends.length)];
      console.log(`📈 Selected trend seed: "${selected}"`);
      return selected;
    }
  } catch (err) {
    console.warn('Failed to fetch trends:', err.message);
  }
  // Ultimate fallback (should never happen because getCombinedTrends has static fallback)
  return "latest technology trends";
}

export async function runStrategy(repoName) {
  console.log(`🧠 Keywords for ${repoName}`);

  // Get a trending keyword from the reliable combined trends source
  let seed = await getTrendingKeyword();
  console.log(`🌐 Seed: ${seed}`);

  // Generate related keywords using AI
  let newKeywords = [];
  for (let attempt = 0; attempt < API_CONFIG.length * 2; attempt++) {
    const api = getNextAvailableKey();
    if (!api) break;
    try {
      const raw = await generateKeywordsViaAPI(api, seed);
      const cleaned = cleanKeywords(raw);
      if (cleaned.length) {
        newKeywords = cleaned;
        break;
      }
    } catch (err) {
      console.warn(`Keyword gen fail ${api.type}: ${err.message}`);
    }
    await delay(1000);
  }

  // If AI fails to generate keywords, use only the seed itself
  if (!newKeywords.length) {
    console.warn(`⚠️ No AI keywords generated, using only the trend seed: "${seed}"`);
    newKeywords = [seed];
  }

  // Store keywords in DB for history (optional)
  let allKeywords = readJson(KEYWORD_DB, {});
  if (!allKeywords[repoName]) allKeywords[repoName] = [];
  for (const kw of newKeywords) {
    if (!allKeywords[repoName].includes(kw)) allKeywords[repoName].push(kw);
  }
  writeJson(KEYWORD_DB, allKeywords);

  // Return the cluster (limit to BLOGS_PER_REPO)
  const cluster = newKeywords.slice(0, CONFIG.BLOGS_PER_REPO);
  return { niche: seed, cluster };
}