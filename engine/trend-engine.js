import axios from 'axios';

async function getGoogleTrends() {
  try {
    const res = await axios.get('https://trends.google.com/trending/rss?geo=IN', { timeout: 10000 });
    const matches = [...res.data.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];
    return matches.map(m => m[1]).filter(t => t && t !== 'Daily Search Trends').slice(0, 5);
  } catch (err) {
    console.warn('Google Trends RSS failed:', err.message);
    return [];
  }
}

export async function getCombinedTrends() {
  console.log("📈 Fetching trends from Google Trends RSS...");
  const trends = await getGoogleTrends();
  if (!trends.length) {
    // fallback static trends
    return ["AI tools", "web development", "SEO strategies", "digital marketing", "cloud computing"];
  }
  console.log(`✅ Found ${trends.length} unique trends`);
  return trends;
}