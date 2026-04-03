import axios from 'axios';
import { CONFIG } from '../config.js';

async function getGoogleTrends() {
  try {
    const res = await axios.get('https://trends.google.com/trending/rss?geo=IN');
    const matches = [...res.data.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];
    return matches.map(m => m[1]).filter(t => t && t !== 'Daily Search Trends').slice(0, 5);
  } catch { return []; }
}

async function getTwitterTrends() {
  // Use unofficial API or scrape (free tier limited). For demo, return dummy.
  // In production, use RapidAPI or twint.
  return ["#AI", "#SEO", "#WebDev"];
}

async function getRedditTrends() {
  try {
    const res = await axios.get('https://www.reddit.com/r/all/top.json?limit=5');
    return res.data.data.children.map(post => post.data.title);
  } catch { return []; }
}

export async function getCombinedTrends() {
  console.log("📈 Fetching trends from multiple sources...");
  let trends = [];
  if (CONFIG.TREND_SOURCES.includes("google")) trends.push(...await getGoogleTrends());
  if (CONFIG.TREND_SOURCES.includes("twitter")) trends.push(...await getTwitterTrends());
  if (CONFIG.TREND_SOURCES.includes("reddit")) trends.push(...await getRedditTrends());
  const unique = [...new Set(trends)];
  console.log(`✅ Found ${unique.length} unique trends`);
  return unique;
}