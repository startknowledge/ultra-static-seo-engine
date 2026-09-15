// ============================================================
// ULTRA STATIC SEO ENGINE
// engine/core.js
//
// Features:
// - Multi-repository SEO automation
// - Keywords sourced primarily from data/keywords.json
// - Fallback to Google News + Google Trends
// - Multi-AI fallback: Mistral -> Groq -> OpenRouter -> Gemini -> HuggingFace
// - Pre-test providers once per run to eliminate wasted requests
// - 1 repository per run (hour-based rotation)
// - Automatic SEO blog generation
// - Blog index + RSS + sitemap-safe
// - Money/affiliate pages
// - Smart affiliate widgets
// - Old blog archiving
// - Safe 404 fixing for engine-generated files only
// - Content rewriter + backlink engine (optional)
// ============================================================

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const Parser = require('rss-parser');
const parser = new Parser();

const simpleGit = require('simple-git');
const { marked } = require('marked');

const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const { injectYandexBlogAds, migrateOldBlogsCss } = require('./yandex-ads.js');

let rotateMoneyPages = null;
try {
  ({ rotateMoneyPages } = require('./auto-money-pages.js'));
} catch (error) {
  console.warn('⚠️ auto-money-pages.js could not be loaded:', error.message);
}

let refreshOldBlogs = null;
try {
  ({ refreshOldBlogs } = require('./content-rewriter.js'));
} catch (error) {
  console.warn('⚠️ content-rewriter.js could not be loaded:', error.message);
}

let autoBacklink = null;
try {
  ({ autoBacklink } = require('./backlink-engine.js'));
} catch (error) {
  console.warn('⚠️ backlink-engine.js could not be loaded:', error.message);
}

let google = null;
try {
  google = require('googleapis');
} catch (error) {
  console.warn('⚠️ googleapis module not installed. Google indexing will be simulated.');
}

// ============================================================
// DOMPURIFY
// ============================================================

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// ============================================================
// BASIC CONFIG
// ============================================================

const GITHUB_TOKEN =
  process.env.ALL_REPO ||
  process.env.MY_GITHUB_TOKEN ||
  process.env.GITHUB_TOKEN;

const GITHUB_USER = process.env.GITHUB_USER || 'startknowledge';

const TEMP_DIR = path.join(__dirname, '..', 'temp_repos');
const CACHE_DIR = path.join(__dirname, '..', '.cache');
const DATA_DIR = path.join(__dirname, '..', 'data');

fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(CACHE_DIR);
fs.ensureDirSync(DATA_DIR);

// ============================================================
// REPOSITORIES
// ============================================================

const REPOS = [
  { name: 'startknowledge', lowPriority: false },
  { name: 'bn-ration-scale', lowPriority: false },
  { name: 'Calculator-Library-Portal', lowPriority: false },
  { name: 'pension-calculator', lowPriority: false },
  { name: 'design-painting', lowPriority: false },
  { name: 'ai-mosaic-studio', lowPriority: false },
  { name: 'ultra-static-seo-engine', lowPriority: false },
  { name: 'Motionix', lowPriority: false },
  { name: 'youtube-video-intelligence-analyzer', lowPriority: false },
  { name: 'universal-image-data-explorer-forge', lowPriority: true }
];

const REPOS_WITH_URL = REPOS.map(repo => ({
  ...repo,
  url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${repo.name}.git`
}));

// ============================================================
// SITE CONFIG LOADER
// ============================================================

function loadRepoConfig() {
  const configPath = path.join(__dirname, '..', 'config', 'repo-config.json');
  if (!fs.existsSync(configPath)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    return {};
  } catch (error) {
    console.warn('⚠️ Failed to read config/repo-config.json:', error.message);
    return {};
  }
}

const REPO_CONFIG = loadRepoConfig();

function getRepoDomain(repoName) {
  // ⭐ New format — check domains map first
  if (REPO_CONFIG?.domains?.[repoName]) {
    return String(REPO_CONFIG.domains[repoName]).replace(/\/+$/, '');
  }
  // Old format — direct entry
  const configured = REPO_CONFIG?.[repoName];
  if (typeof configured === 'string') return configured.replace(/\/+$/, '');
  if (configured && typeof configured.domain === 'string')
    return configured.domain.replace(/\/+$/, '');

  // ⚠️ Fallback — log warning (config में add करें)
  console.warn(`⚠️ No domain in config for "${repoName}" — using fallback URL`);
  return `https://${repoName}.startknowledge.in`;
}

// ============================================================
// ADSENSE + ANALYTICS
// ============================================================

const ADSENSE_CLIENT = 'ca-pub-2162324894765763';
const ADSENSE_SLOTS = {
  top: '1966379200',
  middle: '4441349363',
  bottom: '8024521099',
  fluid: '7592527166'
};
const GA_ID = 'G-Y97JEBHZLV';
const GTM_ID = 'GTM-K435LPQQ';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// GENERAL HELPERS
// ============================================================

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeSlug(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function safeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function getSafeFileName(value) {
  return sanitizeSlug(value) || 'post';
}

// ============================================================
// GOOGLE INDEXING API
// ============================================================

let indexingAuth = null;
if (google && process.env.GOOGLE_INDEXING_KEY) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_INDEXING_KEY);
    indexingAuth = new google.google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing']
    });
    console.log('✅ Google Indexing API initialized');
  } catch (error) {
    console.warn('⚠️ Failed to parse GOOGLE_INDEXING_KEY:', error.message);
  }
}

async function submitToGoogleIndexing(url) {
  if (!indexingAuth) {
    console.log(`📢 Index request simulated: ${url}`);
    return;
  }
  try {
    const client = await indexingAuth.getClient();
    await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: { url, type: 'URL_UPDATED' }
    });
    console.log(`✅ Indexed: ${url}`);
  } catch (error) {
    console.error(`❌ Indexing failed for ${url}:`, error.message);
  }
}

// ============================================================
// CLICKBANK
// ============================================================

let cachedClickbankProducts = null;
let clickbankCacheTime = 0;
const CLICKBANK_CACHE_TTL = 12 * 60 * 60 * 1000;

async function fetchClickBankTopProducts() {
  const now = Date.now();
  if (cachedClickbankProducts && now - clickbankCacheTime < CLICKBANK_CACHE_TTL) {
    console.log(`📦 Using cached ClickBank products (${cachedClickbankProducts.length} items)`);
    return cachedClickbankProducts;
  }

  const apiKey = process.env.CLICKBANK_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ CLICKBANK_API_KEY not set. Using local products.');
    const fallbackPath = path.join(DATA_DIR, 'clickbank-products.json');
    if (fs.existsSync(fallbackPath)) {
      try {
        const products = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        if (Array.isArray(products)) {
          cachedClickbankProducts = products;
          clickbankCacheTime = now;
          return products;
        }
      } catch (error) {
        console.warn('⚠️ Invalid local ClickBank product file:', error.message);
      }
    }
    return [];
  }

  try {
    const url = 'https://api.clickbank.com/rest/1.3/marketplace/feed';
    const response = await axios.get(url, {
      headers: { Authorization: apiKey, Accept: 'application/json' },
      params: { format: 'json', pageSize: 50, sortBy: 'gravity' },
      timeout: 30000
    });

    const items = Array.isArray(response?.data?.items) ? response.data.items : [];
    const products = items
      .map(item => ({
        keyword: String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        affiliate_link: item.account ? `https://${item.account}.hop.clickbank.net` : '',
        product_name: item.name || 'Product',
        niche: item.category || '',
        salesRank: Number(item.gravity || 0),
        commission: Number(item.totalRebillAmt || 0)
      }))
      .filter(product => product.affiliate_link && product.product_name);

    cachedClickbankProducts = products;
    clickbankCacheTime = now;
    console.log(`✅ Fetched ${products.length} ClickBank products`);
    return products;
  } catch (error) {
    console.error('❌ ClickBank API failed:', error.message);
    return [];
  }
}

// ============================================================
// MULTI-AI PROVIDERS
// Order matters: most reliable first, last-resort last
// ============================================================

const AI_PROVIDERS = [
  {
    name: 'Mistral',
    apiKeyEnv: ['MISTRAL_API_KEY1', 'MISTRAL_API_KEY2'],
    modelEnv: 'MISTRAL_MODEL',
    defaultModel: 'open-mistral-7b',
    availableModels: [
      'mistral-small-latest',
      'mistral-large-latest',
      'open-mistral-nemo',
      'open-mistral-7b'
    ],
    buildRequest: (prompt, key, model) => ({
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: {
        model: model || 'open-mistral-7b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500
      }
    }),
    parseResponse: response => response?.data?.choices?.[0]?.message?.content
  },
  {
    name: 'Groq',
    apiKeyEnv: ['GROQ_API_KEY1', 'GROQ_API_KEY2'],
    modelEnv: 'GROQ_MODEL',
    defaultModel: 'llama-3.1-8b-instant',
    availableModels: [
      'qwen/qwen3-32b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-20b'
    ],
    buildRequest: (prompt, key, model) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: {
        model: model || 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      }
    }),
    parseResponse: response => response?.data?.choices?.[0]?.message?.content
  },
  {
    name: 'OpenRouter',
    apiKeyEnv: ['OPENAI_OPENROUTER1', 'OPENAI_OPENROUTER2'],
    modelEnv: 'OPENROUTER_MODEL',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    availableModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'qwen/qwen3-next-80b-a3b-instruct:free'
    ],
    buildRequest: (prompt, key, model) => ({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://startknowledge.in',
        'X-Title': 'StartKnowledge SEO Engine'
      },
      data: {
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500
      }
    }),
    parseResponse: response => response?.data?.choices?.[0]?.message?.content
  },
  {
    name: 'Gemini',
    apiKeyEnv: ['GEMINI_API_KEY1', 'GEMINI_API_KEY2'],
    modelEnv: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.0-flash',
    availableModels: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-latest'
    ],
    buildRequest: (prompt, key, model) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${key}`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2500,
          temperature: 0.7
        }
      }
    }),
    parseResponse: response => response?.data?.candidates?.[0]?.content?.parts?.[0]?.text
  },
  {
    name: 'HuggingFace',
    apiKeyEnv: ['HUGGINGFACE_TOKEN1', 'HUGGINGFACE_TOKEN2'],
    modelEnv: 'HUGGINGFACE_MODEL',
    defaultModel: 'meta-llama/Llama-3.2-3B-Instruct',
    availableModels: [
      'meta-llama/Llama-3.2-3B-Instruct',
      'meta-llama/Llama-3.1-8B-Instruct',
      'Qwen/Qwen2.5-7B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3'
    ],
    buildRequest: (prompt, key, model) => ({
      url: 'https://router.huggingface.co/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model || 'meta-llama/Llama-3.2-3B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      }
    }),
    parseResponse: response => response?.data?.choices?.[0]?.message?.content
  }
];

// ============================================================
// DYNAMIC MODEL LOADER (from test-api.js output)
// test-api.js saves working models to data/provider-models.json
// ============================================================

const PROVIDER_MODELS_FILE = path.join(DATA_DIR, 'provider-models.json');

function loadProviderModels() {
  if (!fs.existsSync(PROVIDER_MODELS_FILE)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(PROVIDER_MODELS_FILE, 'utf8'));
    return data?.providers || {};
  } catch (e) {
    console.warn('⚠️ Could not load provider-models.json:', e.message);
    return {};
  }
}

const DYNAMIC_PROVIDER_MODELS = loadProviderModels();

if (Object.keys(DYNAMIC_PROVIDER_MODELS).length > 0) {
  console.log('📚 Loaded dynamic models from provider-models.json:');
  for (const [name, info] of Object.entries(DYNAMIC_PROVIDER_MODELS)) {
    console.log(`   • ${name}: ${info.models?.length || 0} models`);
  }
} else {
  console.log('📚 No provider-models.json yet — using hardcoded fallback');
}


// ============================================================
// AUTO-MODEL DISCOVERY
// Fetch live models from each provider's API, cache for 24h
// ============================================================

const liveModelsCache = {};
const LIVE_MODEL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchLiveModels(provider) {
  // Cache check
  if (
    liveModelsCache[provider.name] &&
    Date.now() - liveModelsCache[provider.name].timestamp < LIVE_MODEL_CACHE_TTL
  ) {
    return liveModelsCache[provider.name].models;
  }

  let models = [];
  try {
    if (provider.name === 'Groq') {
      const key = process.env.GROQ_API_KEY1 || process.env.GROQ_API_KEY2;
      if (key) {
        const res = await axios.get('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 15000
        });
        models = (res.data?.data || [])
          .map(m => m.id)
          .filter(id => {
            const lower = id.toLowerCase();
            if (lower.includes('guard')) return false;
            if (lower.includes('whisper')) return false;
            if (lower.includes('tts')) return false;
            if (lower.includes('embed')) return false;
            if (lower.includes('audio')) return false;
            if (lower.includes('moderation')) return false;
            return (
              lower.includes('llama') ||
              lower.includes('mixtral') ||
              lower.includes('gemma') ||
              lower.includes('qwen') ||
              lower.includes('deepseek') ||
              lower.includes('kimi') ||
              lower.includes('gpt-oss') ||
              lower.includes('mistral')
            );
          })
          .sort((a, b) => {
            const score = id => {
              const l = id.toLowerCase();
              if (l.includes('70b') || l.includes('versatile')) return 3;
              if (l.includes('mixtral') || l.includes('qwen')) return 2;
              if (l.includes('8b') || l.includes('instant')) return 1;
              return 0;
            };
            return score(b) - score(a);
          });
      }
    } else if (provider.name === 'Gemini') {
      const key = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY2;
      if (key) {
        const res = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
          { timeout: 15000 }
        );
        models = (res.data?.models || [])
          .filter(m =>
            (m.supportedGenerationMethods || []).includes('generateContent')
          )
          .map(m => m.name.replace('models/', ''))
          .filter(id => {
            const lower = id.toLowerCase();
            if (!lower.startsWith('gemini')) return false;
            if (lower.includes('tts')) return false;
            if (lower.includes('vision')) return false;
            if (lower.includes('embedding')) return false;
            if (lower.includes('aqa')) return false;
            if (lower.includes('image')) return false;
            if (lower.includes('learnlm')) return false;
            if (lower.includes('thinking')) return false;
            return lower.includes('flash') || lower.includes('pro');
          })
          .sort((a, b) => {
            const score = id => {
              const l = id.toLowerCase();
              if (l.includes('2.5-flash') && !l.includes('preview')) return 10;
              if (l.includes('2.5-flash')) return 9;
              if (l.includes('2.5-pro') && !l.includes('preview')) return 8;
              if (l.includes('2.5-pro')) return 7;
              if (l.includes('2.0-flash')) return 5;
              if (l.includes('1.5-flash')) return 3;
              if (l.includes('1.5-pro')) return 2;
              return 1;
            };
            return score(b) - score(a);
          });
      }
    } else if (provider.name === 'OpenRouter') {
      const res = await axios.get('https://openrouter.ai/api/v1/models', {
        timeout: 15000
      });
      models = (res.data?.data || [])
        .filter(m => {
          if (!m.id.endsWith(':free')) return false;
          const lower = m.id.toLowerCase();
          if (lower.includes('-vl')) return false;
          if (lower.includes('vision')) return false;
          if (lower.includes('guard')) return false;
          if (lower.includes('embed')) return false;
          // ⭐ Skip "agentic harness only" models
          if (lower.includes('inkling')) return false;
          if (lower.includes('thinkingmachines')) return false;
          const promptPrice = Number(m.pricing?.prompt ?? 0);
          const completionPrice = Number(m.pricing?.completion ?? 0);
          if (promptPrice > 0 || completionPrice > 0) return false;
          return true;
        })
        .sort((a, b) => {
          const ctxA = Number(a.context_length || 0);
          const ctxB = Number(b.context_length || 0);
          return ctxB - ctxA;
        })
        .map(m => m.id)
        .slice(0, 15);
    } else if (provider.name === 'Mistral') {
      const key = process.env.MISTRAL_API_KEY1 || process.env.MISTRAL_API_KEY2;
      if (key) {
        const res = await axios.get('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 15000
        });
        models = (res.data?.data || [])
          .map(m => m.id)
          .filter(id => {
            const lower = id.toLowerCase();
            if (lower.includes('embed')) return false;
            if (lower.includes('moderation')) return false;
            if (lower.includes('ocr')) return false;
            if (lower.includes('codestral')) return false;
            return true;
          })
          .sort((a, b) => {
            const score = id => {
              const l = id.toLowerCase();
              if (l.includes('large-latest')) return 10;
              if (l.includes('medium-latest')) return 9;
              if (l.includes('small-latest')) return 8;
              if (l.includes('large')) return 7;
              if (l.includes('small')) return 6;
              if (l.includes('open-mixtral')) return 5;
              if (l.includes('open-mistral')) return 4;
              return 1;
            };
            return score(b) - score(a);
          });
      }
    } else if (provider.name === 'HuggingFace') {
      const key = process.env.HUGGINGFACE_TOKEN1 || process.env.HUGGINGFACE_TOKEN2;
      if (key) {
        try {
          const res = await axios.get('https://router.huggingface.co/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
            timeout: 15000
          });
          models = (res.data?.data || [])
            .map(m => m.id)
            .filter(id => {
              const lower = id.toLowerCase();
              if (lower.includes('embed')) return false;
              if (lower.includes('rerank')) return false;
              return true;
            })
            .slice(0, 10);
        } catch (e) {
          models = provider.availableModels;
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not fetch live models for ${provider.name}:`, error.message);
  }

  // Fallback to hardcoded list
  if (models.length === 0) {
    models = provider.availableModels || [provider.defaultModel];
  }

  liveModelsCache[provider.name] = { models, timestamp: Date.now() };
  console.log(`🔄 Fetched ${models.length} live models for ${provider.name}`);
  return models;
}

// ============================================================
// MODEL PRE-TEST — एक बार test, पूरे run के लिए save
// ============================================================

const workingModelsCache = {}; // per-run cache

async function preTestProviders() {
  console.log('\n🧪 Pre-testing providers to find working models...');
  const testPrompt = 'Reply with exactly this word and nothing else: OK';

  for (const provider of AI_PROVIDERS) {
    const keys = provider.apiKeyEnv.map(env => process.env[env]).filter(Boolean);
    if (keys.length === 0) {
      console.log(`⏭️ ${provider.name}: No keys configured, skipping`);
      continue;
    }

    // ⭐ Dynamic models from test-api.js output (highest priority)
    const dynamicModels = DYNAMIC_PROVIDER_MODELS[provider.name]?.models || [];

    // Live models
    const liveModels = await fetchLiveModels(provider);

    // Priority: dynamic → live → default → hardcoded
    const testModels = [
      ...dynamicModels,
      ...liveModels.slice(0, 5),
      provider.defaultModel,
      ...provider.availableModels.slice(0, 2)
    ].filter(Boolean);
    const uniqueTest = [...new Set(testModels)];

    let found = false;

    for (const key of keys) {
      if (found) break;
      for (const model of uniqueTest) {
        try {
          const req = provider.buildRequest(testPrompt, key, model);
          const res = await axios.post(req.url, req.data, {
            headers: req.headers,
            timeout: 30000  // ⭐ 20s → 30s (Mistral cold start के लिए)
          });
          const content = provider.parseResponse(res);
          if (content && String(content).trim().length > 0) {
            workingModelsCache[provider.name] = { model, key };
            console.log(`  ✅ ${provider.name}: working model = ${model}`);
            found = true;
            break;
          }
        } catch (error) {
          const status = error.response?.status || 'N/A';
          const msg = error.response?.data?.error?.message || error.message;
          // Silent fail, but log rate limits
          if (status === 429) {
            console.log(`  ⏸️ ${provider.name}: rate limited, trying next key`);
            break;
          }
          if (status === 404 || status === 400 || status === 403) {
            console.log(`  ⚠️  ${provider.name} (${model}) [${status}] — trying next`);
          }
        }
      }
    }

    if (!found) {
      console.log(`  ❌ ${provider.name}: no working model found`);
    }
    await delay(500);
  }

  console.log('🧪 Pre-test complete.\n');
}

// ============================================================
// CONTENT GENERATION — uses pre-test results
// ============================================================

async function generateContentWithFallback(prompt, repoName) {
  for (const provider of AI_PROVIDERS) {
    const cached = workingModelsCache[provider.name];

    // Pre-test में provider fail हुआ तो skip
    if (!cached) {
      console.log(`⏭️ ${provider.name}: skipped (no working model from pre-test)`);
      continue;
    }

    try {
      console.log(`🔍 Trying ${provider.name} with model: ${cached.model}`);
      const request = provider.buildRequest(prompt, cached.key, cached.model);
      const response = await axios.post(request.url, request.data, {
        headers: request.headers,
        timeout: 120000
      });
      const content = provider.parseResponse(response);
      if (content && String(content).trim().length > 200) {
        console.log(`✅ AI generated via ${provider.name} (model: ${cached.model}) for ${repoName}`);
        return String(content).trim();
      }
      console.warn(`⚠️ ${provider.name} returned short content, trying next provider`);
    } catch (error) {
      const status = error.response?.status || 'N/A';
      const msg = error.response?.data?.error?.message || error.message;
      console.warn(`⚠️ ${provider.name} (${cached.model}) failed [${status}]:`, msg);

      if (status === 429) {
        console.warn(`⏸️ ${provider.name} rate limited, removing from this run`);
        delete workingModelsCache[provider.name];
        continue;
      }
      // 402/401/403/404/5xx → next provider
    }
  }
  console.log(`⚠️ All AI providers failed for ${repoName}. Skipping blog.`);
  return null;
}

// ============================================================
// AI BLOG GENERATION
// ============================================================

async function generateBlogContentIfNotExists(keyword, repoName, allBlogsForRepo, blogPath) {
  if (fs.existsSync(blogPath)) {
    console.log(`⏩ Skipping existing blog: ${keyword}`);
    return null;
  }

  const prompt = `
Write a detailed, natural, human-readable,
SEO-optimized blog post of around 1500-1800 words.

Topic:
"${keyword}"

Website:
"${repoName}"

Requirements:

1. Use clean HTML only.
2. Start with one <h1>.
3. Use <h2> and <h3> headings.
4. Use short readable paragraphs.
5. Use <ul>, <ol>, and <li> where useful.
6. Explain the topic deeply.
7. Include an engaging introduction.
8. Include relevant recent information where possible.
9. Mention years accurately.
10. Include practical examples.
11. Include 8-10 actionable strategies or tips.
12. Include common mistakes.
13. Include advantages and limitations where relevant.
14. Include a useful FAQ section with 5 questions.
15. Include a strong conclusion.
16. Use <strong> and <em> naturally.
17. Do not use Markdown.
18. Do not use code fences.
19. Do not include images.
20. Do not invent statistics or fake citations.
21. Do not claim personal experience.
22. Avoid keyword stuffing.
23. Write naturally for real users first and search engines second.

Return ONLY the article HTML.
`;

  let aiContent = await generateContentWithFallback(prompt, repoName);

  if (!aiContent) {
    return null;
  }

  // MARKDOWN -> HTML
  if (aiContent && !/<p[\s>]/i.test(aiContent) && !/<h1[\s>]/i.test(aiContent)) {
    try {
      aiContent = await marked.parse(aiContent);
      aiContent = DOMPurify.sanitize(aiContent);
      console.log(`🔄 Converted Markdown to HTML for ${keyword}`);
    } catch (error) {
      console.warn(`⚠️ Markdown conversion failed for ${keyword}:`, error.message);
    }
  }

  // REMOVE IMAGES
  if (aiContent) {
    aiContent = aiContent.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/<img\b[^>]*>/gi, '');
  }

  // INTERNAL LINKS
  let internalLinksHtml = '';
  if (Array.isArray(allBlogsForRepo) && allBlogsForRepo.length > 1) {
    const related = allBlogsForRepo.filter(blog => blog.title !== keyword).slice(0, 4);
    if (related.length > 0) {
      internalLinksHtml = `<h3>📚 You May Also Like</h3><ul>`;
      for (const blog of related) {
        internalLinksHtml += `<li><a href="${escapeHtml(blog.url)}">${escapeHtml(blog.title)}</a></li>`;
      }
      internalLinksHtml += `</ul>`;
    }
  }
  internalLinksHtml += `<p><a href="index.html">← Browse all blog posts</a></p>`;

  // CROSS REPO LINKS
  const crossRepoLinks = REPOS_WITH_URL.filter(repo => repo.name !== repoName)
    .map(repo => {
      const domain = getRepoDomain(repo.name);
      return `<li><a href="${escapeHtml(domain)}/">${escapeHtml(repo.name.replace(/-/g, ' '))}</a></li>`;
    })
    .join('');
  const crossRepoHtml = `<h3>🌐 Explore Our Other Sites</h3><ul>${crossRepoLinks}</ul>`;

  // EXTERNAL RESOURCES
  const externalResources = [
    { title: 'Google Search Central – SEO Starter Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' },
    { title: 'Google Search Console', url: 'https://search.google.com/search-console/about' },
    { title: 'Schema.org', url: 'https://schema.org/' },
    { title: 'Google PageSpeed Insights', url: 'https://pagespeed.web.dev/' },
    { title: 'Ahrefs Blog', url: 'https://ahrefs.com/blog/' },
    { title: 'Semrush Blog', url: 'https://www.semrush.com/blog/' }
  ];
  const externalHtml = `<h3>🔗 Useful Resources</h3><ul>${externalResources
    .map(res => `<li><a href="${escapeHtml(res.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(res.title)}</a></li>`)
    .join('')}</ul>`;

  return aiContent + internalLinksHtml + crossRepoHtml + externalHtml;
}

// ============================================================
// ADSENSE + ANALYTICS
// ============================================================

function injectAdsAndAnalytics(html) {
  if (!html) return html;

  const analytics = `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '${GA_ID}');
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
`;

  const adTop = `<div class="ads ads-top"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.top}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
  const adMiddle = `<div class="ads ads-middle"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.middle}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
  const adBottom = `<div class="ads ads-bottom"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.bottom}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
  const adFluid = `<div class="ads ads-fluid"><ins class="adsbygoogle" style="display:block" data-ad-format="fluid" data-ad-layout-key="-fw+7+28-5k+1k" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.fluid}"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;

  let newHtml = html;
  if (newHtml.includes('</head>')) newHtml = newHtml.replace('</head>', `${analytics}</head>`);
  if (newHtml.includes('<p>')) newHtml = newHtml.replace('<p>', `${adTop}<p>`);
  if (newHtml.includes('</h2>')) newHtml = newHtml.replace('</h2>', `</h2>${adMiddle}`);
  if (newHtml.includes('</article>')) newHtml = newHtml.replace('</article>', `${adBottom}${adFluid}</article>`);

  return newHtml;
}

// ============================================================
// MONEY PAGES
// ============================================================

async function generateMoneyPages(repoPath, repoName) {
  const csvPath = path.join(__dirname, '..', 'money-keywords.csv');
  if (!fs.existsSync(csvPath)) return [];

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split(/\r?\n/).filter(Boolean).slice(1);
  const generatedFiles = [];
  const domain = getRepoDomain(repoName);

  for (const line of lines) {
    const parts = line.split(',');
    const keyword = parts[0]?.trim();
    const affiliateLink = parts[1]?.trim();
    const productName = parts.slice(2).join(',').trim();
    if (!keyword || !affiliateLink) continue;

    const slug = sanitizeSlug(keyword);
    if (!slug) continue;

    const moneyPagePath = path.join(repoPath, `${slug}.html`);
    if (fs.existsSync(moneyPagePath)) {
      console.log(`⏩ Money page already exists: ${slug}.html`);
      continue;
    }

    const title = productName || keyword;
    const canonical = `${domain}/${slug}.html`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} – Best Deal</title>
<meta name="description" content="Learn more about ${escapeHtml(keyword)} and explore the available offer.">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="Explore ${escapeHtml(keyword)}.">
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 30px 20px; font-family: Arial, sans-serif; background: #f6f8fb; color: #1f2937; }
.container { max-width: 900px; margin: auto; background: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 35px rgba(0,0,0,.08); }
h1 { font-size: 2.2rem; margin-bottom: 20px; }
p { line-height: 1.7; }
.buy-button { display: inline-block; padding: 14px 24px; background: #2563eb; color: #ffffff; border-radius: 10px; text-decoration: none; font-weight: 700; }
.buy-button:hover { opacity: .9; }
.disclosure { font-size: .85rem; color: #64748b; margin-top: 25px; }
</style>
</head>
<body>
<div class="container">
<h1>${escapeHtml(title)}</h1>
<p>Explore information about <strong>${escapeHtml(keyword)}</strong> and review the available offer.</p>
<p><a class="buy-button" href="${escapeHtml(affiliateLink)}" target="_blank" rel="sponsored nofollow noopener">Check offer →</a></p>
<p>Please review the product details, pricing, terms and refund information on the merchant's website before making a purchase.</p>
<p class="disclosure">This page may contain affiliate links. If you purchase through an affiliate link, the website may receive a commission at no additional cost to you.</p>
</div>
</body>
</html>`;

    fs.writeFileSync(moneyPagePath, injectAdsAndAnalytics(html), 'utf8');
    generatedFiles.push(moneyPagePath);
    console.log(`💰 Money page generated: ${moneyPagePath}`);
  }

  // Cache CSV copy per repo
  const repoCacheDir = path.join(CACHE_DIR, 'money-pages');
  fs.ensureDirSync(repoCacheDir);
  const repoCsv = path.join(repoCacheDir, `${sanitizeSlug(repoName)}.csv`);
  try {
    fs.copySync(csvPath, repoCsv);
  } catch (e) { /* ignore */ }

  return generatedFiles;
}

// ============================================================
// SAFE BROKEN LINK FIXER
// ============================================================

async function fixBrokenLinks(repoPath, repoName, generatedFiles = []) {
  if (!Array.isArray(generatedFiles) || generatedFiles.length === 0) return;

  const brokenLinks = [];
  for (const file of generatedFiles) {
    if (!file || !fs.existsSync(file)) continue;
    if (!file.toLowerCase().endsWith('.html')) continue;

    let content;
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }

    const linkRegex = /<a\b[^>]*href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (!href ||
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('//') ||
          href.startsWith('#') ||
          href.startsWith('/') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:')) continue;

      const cleanHref = href.split('#')[0].split('?')[0];
      if (!cleanHref) continue;

      const targetPath = path.resolve(path.dirname(file), cleanHref);
      const repoRoot = path.resolve(repoPath);
      if (!targetPath.startsWith(repoRoot)) continue;
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push({ file, href });
      }
    }
  }

  for (const broken of brokenLinks) {
    if (!fs.existsSync(broken.file)) continue;
    let content;
    try { content = fs.readFileSync(broken.file, 'utf8'); } catch { continue; }

    const escapedHref = broken.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(href=["'])${escapedHref}(["'])`, 'g');
    const updated = content.replace(regex, '$1/$2');
    if (updated !== content) {
      fs.writeFileSync(broken.file, updated, 'utf8');
      console.log(`🔧 Fixed broken generated link in ${broken.file}: ${broken.href} → /`);

      const domain = getRepoDomain(repoName);
      const relative = path.relative(repoPath, broken.file).replace(/\\/g, '/');
      const pageUrl = `${domain}/${relative}`;
      await submitToGoogleIndexing(pageUrl);
    }
  }
}

// ============================================================
// PREPARE REPOSITORY
// ============================================================

async function prepareRepo(repoName, repoUrl) {
  const repoPath = path.join(TEMP_DIR, repoName);
  if (fs.existsSync(repoPath)) {
    console.log(`🔄 Pulling latest changes for ${repoName}...`);
    const git = simpleGit(repoPath);
    try {
      await git.fetch();
      await git.pull('origin', 'main', { '--rebase': 'false' });
    } catch (error) {
      console.warn(`⚠️ Pull failed for ${repoName}:`, error.message);
      console.log('ℹ️ Continuing with existing local repository.');
    }
  } else {
    console.log(`📦 Cloning ${repoName}...`);
    await simpleGit().clone(repoUrl, repoPath);
  }
  return repoPath;
}

// ============================================================
// ARCHIVE OLD BLOG POSTS
// ============================================================

async function archiveOldPosts(repoPath, repoName, retentionDays = 180) {
  const blogDir = path.join(repoPath, 'blog');
  if (!fs.existsSync(blogDir)) return 0;

  const archiveDir = path.join(repoPath, 'archive');
  fs.ensureDirSync(archiveDir);

  const now = Date.now();
  const files = fs.readdirSync(blogDir);
  let archivedCount = 0;

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.html')) continue;
    if (file.toLowerCase() === 'index.html') continue;

    const filePath = path.join(blogDir, file);
    let stats;
    try { stats = fs.statSync(filePath); } catch { continue; }

    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > retentionDays) {
      const destination = path.join(archiveDir, file);
      try {
        await fs.move(filePath, destination, { overwrite: true });
        console.log(`📦 Archived old post: ${file} (${Math.floor(ageDays)} days old)`);
        archivedCount++;
      } catch (error) {
        console.warn(`⚠️ Failed to archive ${file}:`, error.message);
      }
    }
  }

  if (archivedCount > 0) console.log(`📦 Archived ${archivedCount} old posts from ${repoName}`);
  return archivedCount;
}

// ============================================================
// GOOGLE TRENDS FALLBACK
// ============================================================

async function fetchGoogleTrendsKeywords() {
  const url = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN';
  try {
    const feed = await parser.parseURL(url);
    const keywords = [];
    for (const item of feed.items) {
      let title = String(item.title || '').trim();
      title = title.replace(/\s*[–—-]\s*.*$/, '').trim();
      if (title.length > 5 && !keywords.includes(title)) {
        keywords.push(title);
      }
      if (keywords.length >= 15) break;
    }
    if (keywords.length === 0) throw new Error('No Google Trends keywords');
    return keywords;
  } catch (error) {
    console.warn('⚠️ Google Trends RSS failed. Using generic fallback keywords.');
    return [
      'AI trends 2026',
      'Google search updates 2026',
      'technology trends 2026',
      'digital tools 2026',
      'online productivity',
      'artificial intelligence'
    ];
  }
}

// ============================================================
// TRENDING KEYWORDS
// ============================================================

function loadMasterKeywords() {
  const masterPath = path.join(DATA_DIR, 'keywords.json');
  if (!fs.existsSync(masterPath)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.warn('⚠️ Could not parse data/keywords.json:', error.message);
    return {};
  }
}

function findKeywordsForRepo(masterData, repoName) {
  if (!masterData || Object.keys(masterData).length === 0) return null;

  const targetSlug = sanitizeSlug(repoName);

  if (masterData[repoName]) return masterData[repoName];

  for (const key of Object.keys(masterData)) {
    if (sanitizeSlug(key) === targetSlug) {
      return masterData[key];
    }
  }

  return null;
}

async function getTrendingKeywords(seed, repoName) {
  const masterData = loadMasterKeywords();
  const repoKeywords = findKeywordsForRepo(masterData, repoName);

  if (Array.isArray(repoKeywords) && repoKeywords.length > 0) {
    console.log(`📚 Using ${repoKeywords.length} keywords from data/keywords.json for ${repoName}`);

    const shuffled = [...repoKeywords]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(item => item.value);

    return shuffled;
  }

  const cacheFile = path.join(CACHE_DIR, `keywords_${sanitizeSlug(repoName)}.json`);
  const now = Date.now();
  const CACHE_TTL = 10 * 60 * 1000;

  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Array.isArray(cached.keywords) && now - Number(cached.timestamp || 0) < CACHE_TTL) {
        console.log(`📦 Using cached keywords for ${repoName}`);
        return cached.keywords;
      }
    } catch {
      console.warn(`⚠️ Invalid keyword cache for ${repoName}`);
    }
  }

  let keywords = [];
  const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(seed)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const feed = await parser.parseURL(newsUrl);
    for (const item of feed.items) {
      let title = String(item.title || '');
      title = title.replace(/\s*[–—-]\s*.*$/, '').replace(/\s*\|.*$/, '').trim();
      if (title.length > 10 && !keywords.includes(title)) {
        keywords.push(title);
      }
      if (keywords.length >= 15) break;
    }
    if (keywords.length === 0) throw new Error('No Google News results');
  } catch (error) {
    console.warn(`⚠️ Google News failed for ${seed}. Using Google Trends.`);
    keywords = await fetchGoogleTrendsKeywords();
  }

  try {
    fs.writeFileSync(cacheFile, JSON.stringify({ timestamp: now, keywords }, null, 2), 'utf8');
  } catch (error) {
    console.warn('⚠️ Could not save keyword cache:', error.message);
  }

  return keywords;
}

// ============================================================
// BLOG SCHEMA
// ============================================================

function generateSchema(keyword, repoName, slug, imageUrl, date) {
  const domain = getRepoDomain(repoName);
  const articleUrl = `${domain}/blog/${slug}.html`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: keyword,
    description: `Complete guide to ${keyword}.`,
    author: { '@type': 'Organization', name: repoName },
    publisher: { '@type': 'Organization', name: repoName, url: domain },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    datePublished: safeDate(date).toISOString(),
    dateModified: new Date().toISOString(),
    image: imageUrl,
    url: articleUrl
  };
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

// ============================================================
// BLOG INDEX
// ============================================================

async function generateStaticBlogIndex(repoPath, repoName) {
  const blogDir = path.join(repoPath, 'blog');
  fs.ensureDirSync(blogDir);

  const files = fs.readdirSync(blogDir);
  const htmlFiles = files.filter(
    file => file.toLowerCase().endsWith('.html') && file.toLowerCase() !== 'index.html'
  );
  const posts = [];

  for (const file of htmlFiles) {
    const filePath = path.join(blogDir, file);
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }

    const titleMatch = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const rawTitle = titleMatch ? titleMatch[1] : file.replace(/\.html$/i, '').replace(/-/g, ' ');
    const title = rawTitle.replace(/<[^>]*>/g, '').trim();

    const text = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const excerpt = text.substring(0, 150);

    const imageMatch = content.match(/<img\b[^>]*src=["']([^"']+)["']/i);
    const image = imageMatch ? imageMatch[1] : '';

    const dateMatch = content.match(/"datePublished"\s*:\s*"([^"]+)"/i);
    const date = dateMatch ? dateMatch[1] : safeDate(fs.statSync(filePath).mtimeMs).toISOString();

    posts.push({
      title,
      url: file,
      image,
      excerpt: excerpt || `Read the complete guide about ${title}.`,
      date
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const templatePath = path.join(__dirname, '..', 'templates', 'blog-index.html');
  let templateHtml;
  if (fs.existsSync(templatePath)) {
    templateHtml = fs.readFileSync(templatePath, 'utf8');
  } else {
    templateHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(repoName)} Blog</title><meta name="description" content="Latest articles from ${escapeHtml(repoName)}."><style>body { margin: 0; padding: 30px 20px; font-family: Arial, sans-serif; background: #f5f7fb; color: #1f2937; } .container { max-width: 1100px; margin: auto; } .blog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; } .post-card { background: white; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.08); } .post-card img { width: 100%; height: 180px; object-fit: cover; } .card-content { padding: 22px; } .card-content a { text-decoration: none; font-weight: 700; } .ads { margin: 25px 0; } @media(max-width:768px){ .ads { margin: 12px 0; max-height: 130px; overflow: hidden; } .ads ins { max-height: 120px; display: block; overflow: hidden; } } @media(max-width:480px){ .ads { margin: 10px 0; max-height: 115px; } .ads ins { max-height: 100px; } }</style></head><body><div class="container"><h1>${escapeHtml(repoName)} Blog</h1><div id="blogGrid" class="blog-grid"><!-- BLOG_POSTS_PLACEHOLDER --></div></div></body></html>`;
  }

  const blogListHtml = posts
    .map(post => `
<article class="post-card">
${post.image ? `<img class="card-img" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy">` : ''}
<div class="card-content">
<span class="post-category">Blog</span>
<h3>${escapeHtml(post.title)}</h3>
<div class="post-meta">${escapeHtml(safeDate(post.date).toLocaleDateString())}</div>
<p>${escapeHtml(post.excerpt)}...</p>
<a href="${escapeHtml(post.url)}">Read more →</a>
</div>
</article>`)
    .join('\n');

  if (templateHtml.includes('<!-- BLOG_POSTS_PLACEHOLDER -->')) {
    templateHtml = templateHtml.replace('<!-- BLOG_POSTS_PLACEHOLDER -->', blogListHtml);
  } else {
    const marker = '</div>';
    const index = templateHtml.lastIndexOf(marker);
    if (index >= 0) {
      templateHtml = templateHtml.slice(0, index) + blogListHtml + templateHtml.slice(index);
    }
  }

  if (!templateHtml.includes('id="blogGrid"') && templateHtml.includes('class="blog-grid"')) {
    templateHtml = templateHtml.replace('class="blog-grid"', 'id="blogGrid" class="blog-grid"');
  }

  const indexPath = path.join(blogDir, 'index.html');
  let finalBlogIndexHtml = injectAdsAndAnalytics(templateHtml);
  finalBlogIndexHtml = injectYandexBlogAds(finalBlogIndexHtml);

  fs.writeFileSync(indexPath, finalBlogIndexHtml, 'utf8');

  const postsJsonPath = path.join(blogDir, 'posts.json');
  fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2), 'utf8');

  console.log(`📄 Generated blog index with ${posts.length} posts`);
  return posts;
}

// ============================================================
// RSS
// ============================================================

async function generateRssFeed(repoPath, repoName, posts) {
  const rssPath = path.join(repoPath, 'blog', 'rss.xml');
  const domain = getRepoDomain(repoName);
  const now = new Date().toUTCString();

  const items = posts
    .map(post => {
      const url = `${domain}/blog/${post.url}`;
      const pubDate = safeDate(post.date).toUTCString();
      return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid>${escapeXml(url)}</guid><pubDate>${escapeXml(pubDate)}</pubDate><description>${escapeXml(post.excerpt)}</description></item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(repoName)} Blog</title><link>${escapeXml(domain)}/blog/</link><description>Latest articles from ${escapeXml(repoName)}</description><language>en</language><lastBuildDate>${escapeXml(now)}</lastBuildDate><atom:link href="${escapeXml(`${domain}/blog/rss.xml`)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;

  fs.writeFileSync(rssPath, rss, 'utf8');
  console.log(`📡 RSS feed generated: ${rssPath}`);
}

// ============================================================
// AFFILIATE PRODUCT SELECTION
// ============================================================

async function getTopAffiliateProducts(repoName, count = 3) {
  const products = await fetchClickBankTopProducts();
  if (!Array.isArray(products) || products.length === 0) return [];

  const repoWords = repoName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean);

  const ranked = products
    .map(product => {
      const text = `${product.product_name || ''} ${product.niche || ''} ${product.keyword || ''}`.toLowerCase();
      let relevance = 0;
      for (const word of repoWords) {
        if (word.length > 2 && text.includes(word)) relevance++;
      }
      return { product, relevance, salesRank: Number(product.salesRank || 0) };
    })
    .sort((a, b) => b.relevance - a.relevance || b.salesRank - a.salesRank)
    .map(item => item.product);

  return ranked.slice(0, count);
}

// ============================================================
// SIDEBAR WIDGET
// ============================================================

function injectSidebarWidget(html, products) {
  if (!products || products.length === 0) return html;
  const sidebarHtml = `<aside class="affiliate-sidebar" style="position:sticky;top:100px;width:280px;margin-left:30px;background:#fff;border-radius:20px;padding:20px;border:1px solid #e5e7eb;box-shadow:0 10px 25px rgba(0,0,0,.08);"><h3>🔥 Recommended</h3>${products
    .map(
      product => `<div style="margin-bottom:20px;text-align:center;"><p style="font-weight:700;">${escapeHtml(product.product_name)}</p><a href="${escapeHtml(product.affiliate_link)}" rel="sponsored nofollow noopener" target="_blank" style="display:inline-block;padding:9px 15px;border-radius:30px;background:#2563eb;color:#fff;text-decoration:none;">Check offer →</a></div>`
    )
    .join('')}<p style="font-size:.75rem;color:#64748b;">Affiliate disclosure: qualifying purchases may generate a commission.</p></aside>`;
  if (html.includes('</article>')) return html.replace('</article>', `</article>${sidebarHtml}`);
  return html;
}

// ============================================================
// EXIT INTENT
// ============================================================

function injectExitIntentPopup(html, products) {
  if (!products || products.length === 0) return html;
  const randomProduct = products[Math.floor(Math.random() * products.length)];
  const productName = escapeHtml(randomProduct.product_name);
  const affiliate = escapeHtml(randomProduct.affiliate_link);
  const popupScript = `<script>(function(){let popupShown=false;function showPopup(){if(popupShown)return;popupShown=true;const wrapper=document.createElement('div');wrapper.innerHTML=\`<div id="exitPopup" style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;"><div style="background:#fff;max-width:420px;width:100%;padding:30px;border-radius:24px;text-align:center;"><button type="button" onclick="document.getElementById('exitPopup').remove()" style="float:right;border:0;background:none;font-size:24px;cursor:pointer;">×</button><h2>Special Offer</h2><p><strong>${productName}</strong></p><a href="${affiliate}" target="_blank" rel="sponsored nofollow noopener" style="display:inline-block;padding:12px 22px;background:#2563eb;color:#fff;border-radius:30px;text-decoration:none;">Check offer →</a></div></div>\`;document.body.appendChild(wrapper.firstElementChild);}document.addEventListener('mouseleave',function(event){if(event.clientY<=0)showPopup();});})();</script>`;
  return html.replace('</body>', `${popupScript}</body>`);
}

// ============================================================
// FLOATING AFFILIATE WIDGET
// ============================================================

function injectFloatingAd(html, product) {
  if (!product) return html;
  const productName = escapeHtml(product.product_name);
  const affiliate = escapeHtml(product.affiliate_link);
  const script = `<script>setTimeout(function(){if(document.getElementById('floatingAffiliate'))return;const box=document.createElement('div');box.id='floatingAffiliate';box.innerHTML=\`<div style="position:fixed;bottom:20px;right:20px;z-index:9998;background:#fff;border-radius:40px;box-shadow:0 5px 20px rgba(0,0,0,.2);padding:8px 12px;display:flex;align-items:center;gap:10px;max-width:320px;"><span style="font-size:13px;font-weight:700;">🔥 ${productName}</span><a href="${affiliate}" target="_blank" rel="sponsored nofollow noopener" style="background:#2563eb;color:#fff;padding:7px 12px;border-radius:20px;text-decoration:none;font-size:12px;">View</a><button type="button" onclick="document.getElementById('floatingAffiliate').remove()" style="border:0;background:none;cursor:pointer;">×</button></div>\`;document.body.appendChild(box);},5000);</script>`;
  return html.replace('</body>', `${script}</body>`);
}

// ============================================================
// SMART ADS FOR NEW BLOGS ONLY
// ============================================================

async function enhanceNewPostsWithSmartAds(repoPath, repoName, newBlogFiles) {
  if (!Array.isArray(newBlogFiles) || newBlogFiles.length === 0) return;
  const products = await getTopAffiliateProducts(repoName, 4);
  if (products.length === 0) return;

  for (const file of newBlogFiles) {
    const postPath = path.join(repoPath, 'blog', file);
    if (!fs.existsSync(postPath)) continue;
    let html = fs.readFileSync(postPath, 'utf8');
    html = injectSidebarWidget(html, products.slice(0, 2));
    html = injectExitIntentPopup(html, products);
    html = injectFloatingAd(html, products[1] || products[0]);
    fs.writeFileSync(postPath, html, 'utf8');
    console.log(`✅ Smart affiliate widgets added: ${file}`);
  }
}

// ============================================================
// PROCESS SINGLE REPOSITORY
// ============================================================

async function processRepo(repo) {
  console.log(`\n========================================`);
  console.log(`--- Processing ${repo.name} ---`);
  console.log(`========================================`);

  const repoPath = await prepareRepo(repo.name, repo.url);
  const blogDir = path.join(repoPath, 'blog');
  fs.ensureDirSync(blogDir);
  fs.ensureDirSync(path.join(repoPath, 'images'));

  // ============================================================
  // ⭐ YANDEX CSS MIGRATION
  // Purane blogs में inline CSS add करें (जिनमें marker है)
  // ============================================================
  try {
    const migrated = migrateOldBlogsCss(repoPath);
    if (migrated > 0) {
      console.log(`🎨 Migrated ${migrated} old blog(s) with inline Yandex CSS`);
    }
  } catch (error) {
    console.warn(`⚠️ Yandex CSS migration failed for ${repo.name}:`, error.message);
  }

  if (typeof rotateMoneyPages === 'function') {
    try {
      await rotateMoneyPages(repo.name);
    } catch (error) {
      console.warn(`⚠️ Money page rotation failed for ${repo.name}:`, error.message);
    }
  }

  const generatedFiles = [];

  try {
    const moneyFiles = await generateMoneyPages(repoPath, repo.name);
    generatedFiles.push(...moneyFiles);
  } catch (error) {
    console.warn(`⚠️ Money page generation failed for ${repo.name}:`, error.message);
  }

  const seed = repo.name.replace(/-/g, ' ').trim();
  let keywords;
  try {
    keywords = await getTrendingKeywords(seed, repo.name);
  } catch (error) {
    console.warn(`⚠️ Keyword generation failed for ${repo.name}:`, error.message);
    keywords = [];
  }
  console.log(`📈 Keywords for ${repo.name}:`, keywords);

  const allBlogsData = keywords.map(keyword => ({
    title: keyword,
    url: `${sanitizeSlug(keyword)}.html`
  }));

  const newBlogFiles = [];
  const newBlogs = [];

  const MAX_BLOGS_PER_REPO_PER_RUN = 1;
  let blogsGeneratedThisRun = 0;

  for (const keyword of keywords) {
    if (blogsGeneratedThisRun >= MAX_BLOGS_PER_REPO_PER_RUN) {
      console.log(`⏸️ Reached ${MAX_BLOGS_PER_REPO_PER_RUN} blog limit for ${repo.name} this run. Moving to next repo.`);
      break;
    }

    const slug = getSafeFileName(keyword);
    const blogPath = path.join(blogDir, `${slug}.html`);

    if (fs.existsSync(blogPath)) {
      console.log(`⏩ Skipping existing blog: ${keyword}`);
      continue;
    }

    let content;
    if (repo.lowPriority) {
      content = `<h1>${escapeHtml(keyword)}</h1><p>This article provides a practical overview of ${escapeHtml(keyword)} and explains important concepts, useful considerations and common questions.</p><h2>Overview</h2><p>Learn the fundamentals of ${escapeHtml(keyword)} and explore practical ways to understand the subject.</p><h2>Key Points</h2><ul><li>Understand the fundamentals.</li><li>Use reliable information.</li><li>Compare available options.</li><li>Review results regularly.</li></ul><h2>Conclusion</h2><p>Continue researching ${escapeHtml(keyword)} and use trusted information when making important decisions.</p>`;
    } else {
      content = await generateBlogContentIfNotExists(keyword, repo.name, allBlogsData, blogPath);
    }

    if (!content) continue;

    const imageId = Math.floor(Math.random() * 100);
    const imageUrl = `https://picsum.photos/id/${imageId}/1200/630`;
    const publishDate = new Date().toISOString();
    const schema = generateSchema(keyword, repo.name, slug, imageUrl, publishDate);
    const domain = getRepoDomain(repo.name);
    const canonical = `${domain}/blog/${slug}.html`;
    const metaDescription = `Complete guide to ${keyword}. Learn practical strategies, common mistakes and useful information.`;

    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(keyword)} | ${escapeHtml(repo.name)}</title><meta name="description" content="${escapeHtml(metaDescription)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(keyword)}"><meta property="og:description" content="${escapeHtml(metaDescription)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(imageUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(keyword)}"><meta name="twitter:description" content="${escapeHtml(metaDescription)}"><meta name="twitter:image" content="${escapeHtml(imageUrl)}">${schema}<style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#f5f7fb;color:#1f2937;font-family:Arial,Helvetica,sans-serif;line-height:1.7}.container{max-width:1100px;margin:auto;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,.08)}.article-header{padding:30px}.article-image{width:100%;display:block;max-height:630px;object-fit:cover}article{padding:30px}article h1{font-size:2.4rem;line-height:1.2}article h2{margin-top:40px}article h3{margin-top:30px}article p{margin:0 0 18px}article ul,article ol{padding-left:25px}.ads{margin:25px 0}footer{padding:25px;text-align:center;border-top:1px solid #e5e7eb}footer a{text-decoration:none}@media(max-width:768px){body{padding:0}.container{border-radius:0}article{padding:20px}article h1{font-size:1.8rem}.ads{margin:12px 0;max-height:130px;overflow:hidden}.ads ins{max-height:120px;display:block;overflow:hidden}}@media(max-width:480px){.ads{margin:10px 0;max-height:115px}.ads ins{max-height:100px}}</style></head><body><div class="container"><header class="article-header"><h1>${escapeHtml(keyword)}</h1></header><article><img class="article-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(keyword)}" loading="lazy">${content}</article><footer><p>© ${new Date().getFullYear()} ${escapeHtml(repo.name)}</p><p><a href="/">Home</a> &nbsp;|&nbsp; <a href="index.html">Blog</a></p></footer></div></body></html>`;

    html = injectAdsAndAnalytics(html);
    html = injectYandexBlogAds(html);

    fs.writeFileSync(blogPath, html, 'utf8');

    newBlogFiles.push(`${slug}.html`);
    generatedFiles.push(blogPath);
    newBlogs.push({
      title: keyword,
      url: `${slug}.html`,
      image: imageUrl,
      excerpt: metaDescription,
      date: publishDate
    });

    console.log(`📝 Blog generated: ${slug}.html`);

    if (autoBacklink && process.env.MEDIUM_TOKEN) {
      try {
        await autoBacklink(keyword, content, canonical);
      } catch (e) {
        console.warn('⚠️ Medium auto-post failed:', e.message);
      }
    }
    blogsGeneratedThisRun++;
    await delay(5000);
  }

  await enhanceNewPostsWithSmartAds(repoPath, repo.name, newBlogFiles);
  await archiveOldPosts(repoPath, repo.name, 180);

  const posts = await generateStaticBlogIndex(repoPath, repo.name);
  generatedFiles.push(path.join(repoPath, 'blog', 'index.html'));

  await generateRssFeed(repoPath, repo.name, posts);
  await fixBrokenLinks(repoPath, repo.name, generatedFiles);

  const git = simpleGit(repoPath);
  await git.addConfig('user.name', 'seo-bot', false, 'local');
  await git.addConfig('user.email', 'bot@seo.com', false, 'local');
  await git.add('.');
  const status = await git.status();

  if (status.files.length > 0) {
    await git.commit('🤖 Auto-generate SEO blogs + RSS + affiliate content');
    const branch = await git.branch();
    try {
      await git.push('origin', branch.current);
      console.log(`✅ Pushed updates to ${repo.name}`);
    } catch (error) {
      console.error(`❌ Push failed for ${repo.name}:`, error.message);
    }
  } else {
    console.log(`📭 No changes to commit for ${repo.name}`);
  }

  console.log(`✅ Completed ${repo.name} | ${newBlogs.length} new blogs`);
}

// ============================================================
// MAIN — 1 repo per run, hour-based rotation
// ============================================================

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GitHub token is not configured.');
    console.error('Set ALL_REPO, MY_GITHUB_TOKEN or GITHUB_TOKEN.');
    process.exit(1);
  }

  fs.ensureDirSync(TEMP_DIR);
  fs.ensureDirSync(CACHE_DIR);

  console.log('\n🚀 ULTRA STATIC SEO ENGINE STARTED');
  console.log(`📦 Repositories: ${REPOS.length}`);
  console.log('🛡️ User-managed root files are protected from generation.');
  console.log('🗺️ Sitemap generation is disabled.');
  console.log('📚 Keywords source: data/keywords.json (primary)');

  // ⭐ Rotation from config (fallback to default order)
  const rotationSeq = REPO_CONFIG?.rotation?.sequence || REPOS.map(r => r.name);
  const hoursPerRepo = Number(REPO_CONFIG?.rotation?.hoursPerRepo) || 2;

  // ⭐ 1 repo per run based on current hour (UTC)
  // 24 hours / 10 repos ≈ every 2 hours a different repo
  const currentHour = new Date().getUTCHours();
  const index = Math.floor(currentHour / hoursPerRepo) % rotationSeq.length;
  const repoName = rotationSeq[index];
  const repoToProcess = REPOS_WITH_URL.find(r => r.name === repoName) || REPOS_WITH_URL[0];

  console.log(`\n🕐 Hour ${currentHour} UTC → Repo #${index}: ${repoToProcess.name}`);
  console.log(`📋 Sequence (first 3): ${rotationSeq.slice(0, 3).join(' → ')}...`);

  // ⭐ Pre-test providers once per run
  await preTestProviders();

  // ⭐ Process ONLY the selected repo
  try {
    await processRepo(repoToProcess);
  } catch (error) {
    console.error(`❌ Repository failed: ${repoToProcess.name}`, error);
  }

  // ⭐ Refresh old blogs ONLY for the selected repo
  if (refreshOldBlogs) {
    console.log(`\n♻️ Refreshing old blog posts (180+ days) for ${repoToProcess.name}...`);
    try {
      await refreshOldBlogs(repoToProcess.name, 180);
    } catch (error) {
      console.warn(`⚠️ Content refresh failed for ${repoToProcess.name}:`, error.message);
    }
  }

  console.log('\n🔥 SYSTEM COMPLETE');
}

// ============================================================
// START
// ============================================================

main().catch(error => {
  console.error('❌ Fatal engine error:', error);
  process.exit(1);
});