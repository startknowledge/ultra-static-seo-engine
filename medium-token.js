const express = require('express');
const axios = require('axios');
const open = require('open');
const app = express();
const PORT = 3000;

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

let authCode = null;

app.get('/auth', (req, res) => {
  const authUrl = `https://medium.com/m/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=random`;
  res.send(`<a href="${authUrl}">Authorize Medium</a>`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');
  authCode = code;
  try {
    const tokenRes = await axios.post('https://medium.com/v1/tokens', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });
    const token = tokenRes.data.access_token;
    res.send(`<pre>Your Access Token: ${token}</pre><p>Copy this token and set it as MEDIUM_TOKEN secret.</p>`);
    console.log(`✅ Token: ${token}`);
  } catch (err) {
    res.send('Error exchanging code: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/auth`);
  open(`http://localhost:${PORT}/auth`);
});