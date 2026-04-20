// test-api.js – API keys को test करने के लिए
const axios = require('axios');

async function testGroq() {
  const key = process.env.GROQ_API_KEY1;
  if (!key) return console.log('❌ GROQ_API_KEY1 missing');
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    }, { headers: { Authorization: `Bearer ${key}` } });
    console.log('✅ Groq works:', res.data.choices[0].message.content);
  } catch(e) {
    console.log('❌ Groq error:', e.response?.status, e.response?.data);
  }
}

async function testGemini() {
  const key = process.env.GEMINI_API_KEY1;
  if (!key) return console.log('❌ GEMINI_API_KEY1 missing');
  try {
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      contents: [{ parts: [{ text: 'Say "OK"' }] }],
      generationConfig: { maxOutputTokens: 5 }
    });
    console.log('✅ Gemini works:', res.data.candidates[0].content.parts[0].text);
  } catch(e) {
    console.log('❌ Gemini error:', e.response?.status, e.response?.data);
  }
}

// Test Groq and Gemini
testGroq();
testGemini();