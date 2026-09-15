// ============================================================
// PROVIDER MODEL DISCOVERY & TEST
// Discovers working models for all providers and saves them
// to data/provider-models.json for core.js to use
// ============================================================

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'provider-models.json');

fs.ensureDirSync(DATA_DIR);

const TEST_PROMPT = 'Reply with exactly this word and nothing else: OK';

// ============================================================
// Provider definitions
// ============================================================

const providers = [
  {
    name: 'Mistral',
    keyEnvs: ['MISTRAL_API_KEY1', 'MISTRAL_API_KEY2'],
    discoverUrl: 'https://api.mistral.ai/v1/models',
    discoverHeaders: key => ({ Authorization: `Bearer ${key}` }),
    buildTestRequest: (key, model) => ({
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: {
        model,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 10
      }
    }),
    parseResponse: r => r?.data?.choices?.[0]?.message?.content,
        filterModels: ids => ids.filter(id => {
      const l = id.toLowerCase();
      if (l.includes('embed')) return false;
      if (l.includes('moderation')) return false;
      if (l.includes('ocr')) return false;
      if (l.includes('codestral')) return false;
      // ⭐ Exclude non-chat specialized models
      if (l.includes('voxtral')) return false;    // voice/audio model
      if (l.includes('magistral')) return false;  // reasoning-heavy
      if (l.includes('code')) return false;       // coding model
      if (l.includes('fim')) return false;        // fill-in-middle
      return true;
    }).sort((a, b) => {
      const score = id => {
        const l = id.toLowerCase();
        if (l.includes('mistral-medium-latest')) return 100;
        if (l.includes('mistral-small-latest')) return 99;
        if (l.includes('mistral-large-latest')) return 98;
        if (l.includes('mistral-large-2411')) return 90;
        if (l.includes('mistral-small-2409')) return 85;
        if (l.includes('open-mistral-nemo')) return 80;
        if (l.includes('open-mixtral-8x7b')) return 70;
        if (l.includes('open-mixtral-8x22b')) return 65;
        if (l.includes('open-mistral-7b')) return 60;
        if (l.includes('large')) return 50;
        if (l.includes('medium')) return 45;
        if (l.includes('small')) return 40;
        return 1;
      };
      return score(b) - score(a);
    })
  },
  {
    name: 'Groq',
    keyEnvs: ['GROQ_API_KEY1', 'GROQ_API_KEY2'],
    discoverUrl: 'https://api.groq.com/openai/v1/models',
    discoverHeaders: key => ({ Authorization: `Bearer ${key}` }),
    buildTestRequest: (key, model) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: {
        model,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 10
      }
    }),
    parseResponse: r => r?.data?.choices?.[0]?.message?.content,
    filterModels: ids => ids.filter(id => {
      const l = id.toLowerCase();
      if (l.includes('guard')) return false;
      if (l.includes('whisper')) return false;
      if (l.includes('tts')) return false;
      if (l.includes('embed')) return false;
      if (l.includes('audio')) return false;
      if (l.includes('moderation')) return false;
      return (
        l.includes('llama') || l.includes('mixtral') || l.includes('gemma') ||
        l.includes('qwen') || l.includes('deepseek') || l.includes('kimi') ||
        l.includes('gpt-oss') || l.includes('mistral')
      );
    }).sort((a, b) => {
      const score = id => {
        const l = id.toLowerCase();
        if (l.includes('70b') || l.includes('versatile')) return 3;
        if (l.includes('mixtral') || l.includes('qwen')) return 2;
        if (l.includes('8b') || l.includes('instant')) return 1;
        return 0;
      };
      return score(b) - score(a);
    })
  },
  {
    name: 'OpenRouter',
    keyEnvs: ['OPENAI_OPENROUTER1', 'OPENAI_OPENROUTER2'],
    discoverUrl: 'https://openrouter.ai/api/v1/models',
    discoverHeaders: () => ({}),
    buildTestRequest: (key, model) => ({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://startknowledge.in',
        'X-Title': 'StartKnowledge SEO Engine'
      },
      data: {
        model,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 10
      }
    }),
    parseResponse: r => r?.data?.choices?.[0]?.message?.content,
    transformModels: (data) => (data?.data || []),
    filterModels: (models) => models
      .filter(m => {
        if (!m.id.endsWith(':free')) return false;
        const l = m.id.toLowerCase();
        if (l.includes('-vl')) return false;
        if (l.includes('vision')) return false;
        if (l.includes('guard')) return false;
        if (l.includes('embed')) return false;
        if (l.includes('inkling')) return false;
        if (l.includes('thinkingmachines')) return false;
        const pp = Number(m.pricing?.prompt ?? 0);
        const cp = Number(m.pricing?.completion ?? 0);
        if (pp > 0 || cp > 0) return false;
        return true;
      })
      .sort((a, b) => (Number(b.context_length) || 0) - (Number(a.context_length) || 0))
      .map(m => m.id)
      .slice(0, 15)
  },
  {
    name: 'Gemini',
    keyEnvs: ['GEMINI_API_KEY1', 'GEMINI_API_KEY2'],
    discoverUrlFn: key => `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    discoverHeaders: () => ({}),
    buildTestRequest: (key, model) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        contents: [{ parts: [{ text: TEST_PROMPT }] }],
        generationConfig: { maxOutputTokens: 10 }
      }
    }),
    parseResponse: r => r?.data?.candidates?.[0]?.content?.parts?.[0]?.text,
    transformModels: (data) => (data?.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', '')),
    filterModels: ids => ids.filter(id => {
      const l = id.toLowerCase();
      if (!l.startsWith('gemini')) return false;
      if (l.includes('tts')) return false;
      if (l.includes('vision')) return false;
      if (l.includes('embedding')) return false;
      if (l.includes('aqa')) return false;
      if (l.includes('image')) return false;
      if (l.includes('learnlm')) return false;
      if (l.includes('thinking')) return false;
      return l.includes('flash') || l.includes('pro');
    }).sort((a, b) => {
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
    })
  },
  {
    // ⭐ HuggingFace — पूरा proper format में
    name: 'HuggingFace',
    keyEnvs: ['HUGGINGFACE_TOKEN1', 'HUGGINGFACE_TOKEN2'],
    discoverUrl: 'https://router.huggingface.co/v1/models',
    discoverHeaders: key => ({ Authorization: `Bearer ${key}` }),
    buildTestRequest: (key, model) => ({
      url: 'https://router.huggingface.co/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      data: {
        model,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 10
      }
    }),
    parseResponse: r => r?.data?.choices?.[0]?.message?.content,
    filterModels: ids => ids.filter(id => {
      const l = id.toLowerCase();
      if (l.includes('embed')) return false;
      if (l.includes('rerank')) return false;
      if (l.includes('whisper')) return false;
      if (l.includes('image')) return false;
      if (l.includes('vision')) return false;
      return true;
    }).slice(0, 10)
  }
];

// ============================================================
// Discover live models
// ============================================================

async function discoverModels(provider, key) {
  try {
    const url = provider.discoverUrlFn ? provider.discoverUrlFn(key) : provider.discoverUrl;
    const headers = provider.discoverHeaders(key);
    const res = await axios.get(url, { headers, timeout: 20000 });

    let rawIds;
    if (provider.transformModels) {
      rawIds = provider.transformModels(res.data);
    } else {
      rawIds = (res.data?.data || []).map(m => m.id);
    }

    return provider.filterModels(rawIds);
  } catch (e) {
    console.log(`  ⚠️ Could not discover models: ${e.message}`);
    return [];
  }
}

// ============================================================
// Test single model
// ============================================================

async function testModel(provider, key, model) {
  try {
    const req = provider.buildTestRequest(key, model);
    const res = await axios.post(req.url, req.data, {
      headers: req.headers,
      timeout: 30000
    });
    const content = provider.parseResponse(res);
    if (content && String(content).trim().length > 0) {
      return { ok: true, msg: String(content).trim().slice(0, 30) };
    }
    return { ok: false, msg: 'empty response' };
  } catch (e) {
    const status = e.response?.status || 'N/A';
    const msg = e.response?.data?.error?.message || e.response?.data?.message || e.message;
    return { ok: false, status, msg: String(msg).slice(0, 100) };
  }
}

// ============================================================
// Test provider — all keys × top models
// ============================================================

async function testProvider(provider) {
  console.log(`\n🔎 Testing ${provider.name}`);
  console.log(`─${'─'.repeat(50)}`);

  const keys = provider.keyEnvs.map(env => ({ env, key: process.env[env] })).filter(k => k.key);
  if (keys.length === 0) {
    console.log(`  ⚠️ No keys configured`);
    return { name: provider.name, workingModels: [], workingKeys: {} };
  }

  const discovered = await discoverModels(provider, keys[0].key);
  console.log(`  🔍 Discovered ${discovered.length} candidate models`);

  if (discovered.length === 0) {
    console.log(`  ❌ No candidates to test`);
    return { name: provider.name, workingModels: [], workingKeys: {} };
  }

  const testList = discovered.slice(0, 10);
  const workingModels = [];
  const workingKeys = {};

  for (const model of testList) {
    let modelOk = false;
    for (const { env, key } of keys) {
      const result = await testModel(provider, key, model);
      if (result.ok) {
        console.log(`  ✅ ${env} + ${model} — "${result.msg}"`);
        workingModels.push(model);
        workingKeys[model] = env;
        modelOk = true;
        break;
      } else {
        const status = result.status || '';
        if (status === 429) {
          console.log(`  ⏸️ ${env} + ${model} — rate limited`);
        } else {
          console.log(`  ❌ ${env} + ${model} — [${status}] ${result.msg}`);
        }
      }
      await delay(1500);
    }
    if (modelOk && workingModels.length >= 5) break;
  }

  return { name: provider.name, workingModels, workingKeys };
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔑  PROVIDER MODEL DISCOVERY & TEST');
  console.log('  Saves working models → data/provider-models.json');
  console.log('═══════════════════════════════════════════════════════');

  const output = {
    updatedAt: new Date().toISOString(),
    providers: {}
  };

  const summary = [];

  for (const provider of providers) {
    const result = await testProvider(provider);
    summary.push(result);

    if (result.workingModels.length > 0) {
      output.providers[result.name] = {
        models: result.workingModels,
        keyEnv: Object.values(result.workingKeys)[0] || null
      };
    }

    await delay(1500);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  📊  SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  for (const s of summary) {
    const status = s.workingModels.length > 0 ? '✅' : '❌';
    console.log(`  ${status} ${s.name}: ${s.workingModels.length} working models`);
    for (const m of s.workingModels.slice(0, 3)) {
      console.log(`      • ${m}`);
    }
  }

  console.log(`\n  💾 Saved: ${OUTPUT_FILE}`);
  console.log(`  📅 At: ${output.updatedAt}\n`);

  const anyWorking = summary.some(s => s.workingModels.length > 0);
  if (!anyWorking) {
    console.log('  ⛔  No providers working!\n');
    process.exit(1);
  }
  console.log('  🚀  Ready!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});