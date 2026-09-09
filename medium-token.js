const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = 3000;

// ⚠️ Replace these with your actual Client ID and Secret
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

app.get('/auth', (req, res) => {
  const authUrl = `https://medium.com/m/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=random`;
  res.send(`
    <h1>Medium OAuth</h1>
    <p>Click the link below to authorize:</p>
    <a href="${authUrl}" target="_blank">${authUrl}</a>
    <p>After authorizing, you will be redirected back here.</p>
  `);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.send('No code provided. Please try again.');
  }
  try {
    const tokenRes = await axios.post('https://medium.com/v1/tokens', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });
    const token = tokenRes.data.access_token;
    // Save token to a file
    fs.writeFileSync('medium-token.txt', token);
    res.send(`
      <h2>✅ Token received!</h2>
      <pre>${token}</pre>
      <p>Token also saved to <b>medium-token.txt</b> in the current folder.</p>
      <p>You can now close this window.</p>
    `);
    console.log(`✅ Token: ${token}`);
    console.log('✅ Token saved to medium-token.txt');
    // Exit after a few seconds
    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    console.error('Error exchanging code:', err.response?.data || err.message);
    res.send('Error: ' + (err.response?.data?.message || err.message));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/auth`);
  console.log('👉 Open this URL in your browser:');
  console.log(`👉 http://localhost:${PORT}/auth`);
});