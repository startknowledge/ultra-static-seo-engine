import axios from 'axios';
import { CONFIG } from '../config.js';
import { readJson, writeJson, delay } from './utils.js';

const KEYWORD_DB = './data/keywords.json';

// Build API list from environment variables
const API_CONFIG = [
  // Gemini (2)
  ...['GEMINI_API_KEY1','GEMINI_API_KEY2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'gemini', model: 'gemini-2.0-flash' })),
  // Groq (2)
  ...['GROQ_API_KEY1','GROQ_API_KEY2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'groq', model: 'llama-3.3-70b-versatile' })),
  // OpenRouter (2)
  ...['OPENAI_OPENROUTER1','OPENAI_OPENROUTER2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'openrouter', model: 'openai/gpt-4o-mini' })),
  // Hugging Face (2)
  ...['HUGGINGFACE_TOKEN1','HUGGINGFACE_TOKEN2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'huggingface', model: 'meta-llama/Llama-2-7b-chat-hf' })),
  // Mistral (2)
  ...['MISTRAL_API_KEY1','MISTRAL_API_KEY2']
    .filter(k => process.env[k])
    .map(key => ({ key: process.env[key], type: 'mistral', model: 'mistral-large-latest' })),
  // Cloudflare (if both account ID and token exist)
  ...(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN ? [{
    key: process.env.CLOUDFLARE_API_TOKEN,
    type: 'cloudflare',
    model: '@cf/meta/llama-3.3-70b-instruct',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID
  }] : []),
];

console.log(`🔑 Loaded ${API_CONFIG.length} API keys`);

// Per‑key rate limit state (simple counter + last reset)
const keyState = new Map();
API_CONFIG.forEach(api => {
  keyState.set(api, { used: 0, resetTime: Date.now() });
});

function canUseKey(api) {
  const state = keyState.get(api);
  if (!state) return false;
  // Reset every minute (60000 ms)
  if (Date.now() - state.resetTime > 60000) {
    state.used = 0;
    state.resetTime = Date.now();
    return true;
  }
  // Gemini: 60 req/min, others assume 30
  const limit = api.type === 'gemini' ? 60 : 30;
  return state.used < limit;
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

// Generic AI content generator
export async function generateAIContent(prompt) {
  for (let attempt = 0; attempt < API_CONFIG.length * 2; attempt++) {
    const api = getNextAvailableKey();
    if (!api) {
      console.warn('⚠️ No available API key – waiting 60s');
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
          model: api.model,
          messages: [{ role: 'user', content: prompt }],
        }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'openrouter') {
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: api.model,
          messages: [{ role: 'user', content: prompt }],
        }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'huggingface') {
        const url = `https://api-inference.huggingface.co/models/${api.model}`;
        const res = await axios.post(url, { inputs: prompt }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.[0]?.generated_text;
      } else if (api.type === 'mistral') {
        const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
          model: api.model,
          messages: [{ role: 'user', content: prompt }],
        }, { headers: { Authorization: `Bearer ${api.key}` } });
        result = res.data?.choices?.[0]?.message?.content;
      } else if (api.type === 'cloudflare') {
        const url = `https://api.cloudflare.com/client/v4/accounts/${api.accountId}/ai/run/${api.model}`;
        const res = await axios.post(url, { messages: [{ role: 'user', content: prompt }] }, {
          headers: { Authorization: `Bearer ${api.key}` }
        });
        result = res.data?.result?.response;
      }

      if (result && result.length > 100) {
        markUsed(api);
        console.log(`✅ AI content using ${api.type} (key used: ${keyState.get(api).used}/min)`);
        return result.trim();
      }
    } catch (err) {
      console.warn(`⚠️ ${api.type} failed: ${err.message}`);
      if (err.response?.status === 429) {
        // Force reset of this key's state to block it for 60s
        keyState.set(api, { used: 999, resetTime: Date.now() });
        await delay(60000);
      }
    }
    await delay(1000);
  }
  console.error('❌ All AI providers failed');
  return null;
}

// Google Trends (unchanged)
async function getTrendingKeyword() {
  try {
    const res = await axios.get('https://trends.google.com/trending/rss?geo=IN');
    const xml = res.data;
    const matches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];
    const titles = matches.map(m => m[1]).filter(t => t && t !== 'Daily Search Trends');
    if (titles.length) return titles[Math.floor(Math.random() * titles.length)];
  } catch {}
  return null;
}

// Keyword generation (reuses same API rotation)
async function generateKeywordsViaAPI(api, seed) {
  const prompt = `Generate 10 SEO keywords related to "${seed}". Return only a list, one per line, no numbers.`;
  // same switch as generateAIContent but simpler
  if (api.type === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1/models/${api.model}:generateContent?key=${api.key}`;
    const res = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }
  // similar for others – omitted for brevity, but you can copy the pattern
  return null;
}

function cleanKeywords(text) {
  if (!text) return [];
  return text.split('\n')
    .map(l => l.replace(/^\d+[).-]\s*/, '').trim())
    .filter(k => k.length > 2)
    .slice(0, 10);
}

export async function runStrategy(repoName) {
  console.log(`🧠 Keywords for ${repoName}`);
  let allKeywords = readJson(KEYWORD_DB, {});
  let seed = await getTrendingKeyword() || repoName.replace(/[^a-z0-9]/gi, ' ').trim();
  console.log(`🌐 Seed: ${seed}`);

  let newKeywords = [];
  for (let attempt = 0; attempt < API_CONFIG.length * 2; attempt++) {
    const api = getNextAvailableKey();
    if (!api) break;
    try {
      const raw = await generateKeywordsViaAPI(api, seed);
      const cleaned = cleanKeywords(raw);
      if (cleaned.length) { newKeywords = cleaned; break; }
    } catch (err) { console.warn(`Keyword gen fail ${api.type}`); }
    await delay(1000);
  }
  if (!newKeywords.length) newKeywords = [seed];

  if (!allKeywords[repoName]) allKeywords[repoName] = [];
  for (const kw of newKeywords) if (!allKeywords[repoName].includes(kw)) allKeywords[repoName].push(kw);
  writeJson(KEYWORD_DB, allKeywords);
  const cluster = allKeywords[repoName].slice(-CONFIG.BLOGS_PER_REPO);
  return { niche: seed, cluster };
}