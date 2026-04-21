const axios = require('axios');

const providers = [
  { name: 'Groq', keyEnv: 'GROQ_API_KEY1', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', payload: (key) => ({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 }) },
  { name: 'Gemini', keyEnv: 'GEMINI_API_KEY1', url: (key) => `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`, payload: () => ({ contents: [{ parts: [{ text: 'Say OK' }] }], generationConfig: { maxOutputTokens: 5 } }) },
  { name: 'OpenRouter', keyEnv: 'OPENAI_OPENROUTER1', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-3.2-3b-instruct:free', payload: (key) => ({ model: 'meta-llama/llama-3.2-3b-instruct:free', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 }) },
  { name: 'Mistral', keyEnv: 'MISTRAL_API_KEY1', url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-tiny', payload: (key) => ({ model: 'mistral-tiny', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 }) },
  { name: 'HuggingFace', keyEnv: 'HUGGINGFACE_TOKEN1', url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', payload: (key) => ({ inputs: 'Say OK', parameters: { max_new_tokens: 5 } }) }
];

async function testProvider(provider) {
  const key = process.env[provider.keyEnv];
  if (!key) return console.log(`❌ ${provider.name} – missing key`);
  try {
    let url = typeof provider.url === 'function' ? provider.url(key) : provider.url;
    let payload = provider.payload(key);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    const res = await axios.post(url, payload, { headers });
    console.log(`✅ ${provider.name} works`);
  } catch(e) {
    console.log(`❌ ${provider.name} error: ${e.response?.status} ${e.response?.data?.error?.message || ''}`);
  }
}

for (const p of providers) testProvider(p);