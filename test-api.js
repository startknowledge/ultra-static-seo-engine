// ============================================================
// API KEY TESTER — Tests BOTH keys for each provider
// ============================================================

const axios = require('axios');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const providers = [
  {
    name: 'Groq',
    keyEnvs: ['GROQ_API_KEY1', 'GROQ_API_KEY2'],
    model: 'llama-3.1-8b-instant',
    test: async (key) => {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      return res.data?.choices?.[0]?.message?.content;
    }
  },
  {
    name: 'Gemini',
    keyEnvs: ['GEMINI_API_KEY1', 'GEMINI_API_KEY2'],
    model: 'gemini-2.0-flash',
    test: async (key) => {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: 'Say OK' }] }],
          generationConfig: { maxOutputTokens: 5 }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }
  },
  {
    name: 'OpenRouter',
    keyEnvs: ['OPENAI_OPENROUTER1', 'OPENAI_OPENROUTER2'],
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    test: async (key) => {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://startknowledge.in',
            'X-Title': 'StartKnowledge SEO Engine'
          },
          timeout: 30000
        }
      );
      return res.data?.choices?.[0]?.message?.content;
    }
  },
  {
    name: 'Mistral',
    keyEnvs: ['MISTRAL_API_KEY1', 'MISTRAL_API_KEY2'],
    model: 'open-mistral-7b',
    test: async (key) => {
      const res = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'open-mistral-7b',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      return res.data?.choices?.[0]?.message?.content;
    }
  },
  {
    name: 'HuggingFace',
    keyEnvs: ['HUGGINGFACE_TOKEN1', 'HUGGINGFACE_TOKEN2'],
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    test: async (key) => {
      const res = await axios.post(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions',
        {
          model: 'mistralai/Mistral-7B-Instruct-v0.3',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      return res.data?.choices?.[0]?.message?.content;
    }
  }
];

async function testProvider(provider) {
  console.log(`\n🔎 Testing ${provider.name} (model: ${provider.model})`);
  console.log(`─${'─'.repeat(50)}`);

  let anySuccess = false;

  for (const keyEnv of provider.keyEnvs) {
    const key = process.env[keyEnv];
    if (!key) {
      console.log(`  ⚠️  ${keyEnv}: MISSING`);
      continue;
    }

    try {
      const result = await provider.test(key);
      if (result && result.trim().length > 0) {
        console.log(`  ✅ ${keyEnv}: WORKS (response: "${result.trim().slice(0, 30)}")`);
        anySuccess = true;
      } else {
        console.log(`  ⚠️  ${keyEnv}: WORKS but empty response`);
      }
    } catch (e) {
      const status = e.response?.status || 'N/A';
      const msg = e.response?.data?.error?.message || e.message || 'Unknown error';
      console.log(`  ❌ ${keyEnv}: FAILED [${status}] ${msg.slice(0, 100)}`);
    }

    // Rate-limit friendly delay between keys
    await delay(1500);
  }

  return anySuccess;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔑  API KEY TESTER — Testing ALL keys (KEY1 + KEY2)');
  console.log('═══════════════════════════════════════════════════════');

  const summary = [];

  for (const provider of providers) {
    const ok = await testProvider(provider);
    summary.push({ name: provider.name, status: ok ? '✅' : '❌' });
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  📊  SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  for (const s of summary) {
    console.log(`  ${s.status}  ${s.name}`);
  }

  const working = summary.filter(s => s.status === '✅').length;
  console.log(`\n  🎯  ${working}/${summary.length} providers working`);

  if (working === 0) {
    console.log('\n  ⛔  No providers working! Check your GitHub Secrets.');
    process.exit(1);
  }

  console.log('\n  🚀  Ready to generate blogs!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error in tester:', err.message);
  process.exit(1);
});