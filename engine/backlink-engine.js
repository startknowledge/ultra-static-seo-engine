import { generateAIContent } from './strategy-engine.js';
import fs from 'fs';
import axios from 'axios';

// Medium integration (requires Medium integration token)
export async function postToMedium(title, content, tags) {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) return;
  const userId = await getMediumUserId(token);
  const res = await axios.post(`https://api.medium.com/v1/users/${userId}/posts`, {
    title, contentFormat: 'html', content, tags, publishStatus: 'draft'
  }, { headers: { Authorization: `Bearer ${token}` } });
  console.log("Posted to Medium:", res.data.data.url);
}

// Reddit integration (requires Reddit API credentials)
export async function postToReddit(subreddit, title, content) {
  // Use snoowrap or simple OAuth
  // For brevity, placeholder
  console.log(`Would post to r/${subreddit}: ${title}`);
}

export async function autoBacklink(blogTitle, blogContent, blogUrl) {
  // Shorten content for social media
  const snippet = blogContent.substring(0, 200) + `... Read more: ${blogUrl}`;
  await postToMedium(blogTitle, snippet, ["SEO", "AI"]);
  await postToReddit("SEO", blogTitle, snippet);
}