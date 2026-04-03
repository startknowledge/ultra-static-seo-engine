import axios from 'axios';

export async function getTrendsForKeyword(keyword) {
  // Use unofficial Google Trends API (free, no key)
  try {
    const url = `https://trends.google.com/trends/api/explore?hl=en&req={"comparisonItem":[{"keyword":"${encodeURIComponent(keyword)}","geo":"IN"}],"category":0,"property":""}`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    // Parse JSONP response
    const jsonStr = res.data.substring(5);
    const data = JSON.parse(jsonStr);
    const relatedTopics = data.relatedQueries?.top?.[0]?.linkedTopics?.slice(0, 5) || [];
    return relatedTopics.map(t => t.topic.title);
  } catch (err) {
    console.warn(`Trends fetch failed for ${keyword}:`, err.message);
    return [`${keyword} trends`, `Latest ${keyword} news`, `How to ${keyword}`, `Best ${keyword} tools`, `${keyword} guide 2026`];
  }
}