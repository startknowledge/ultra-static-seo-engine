import { getCombinedTrends } from './trend-engine.js';
import { generateAIContent } from './strategy-engine.js';
import { sanitizeSlug, generateImage } from './utils.js';
import fs from 'fs';

export async function generateTrendBlogs(repoName, domain, strategy) {
  const trends = await getCombinedTrends();
  const topTrends = trends.slice(0, 3);
  const blogDir = `./docs/${repoName}/blog`;
  const imgDir = `./docs/${repoName}/blog/images`;
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  const newBlogs = [];
  for (const trend of topTrends) {
    const slug = sanitizeSlug(`trend-${trend}`);
    const url = `${domain}/blog/${slug}.html`;
    let content = await generateAIContent(`Write a short, engaging blog post about the trending topic: "${trend}". Include why it's trending and future predictions. 500 words.`);
    if (!content) content = `<p>Trending now: ${trend}. Stay tuned for updates.</p>`;
    await generateImage(trend, `${imgDir}/${slug}.jpg`);
    const html = `<!DOCTYPE html>...`; // same template as regular blog
    fs.writeFileSync(`${blogDir}/${slug}.html`, html);
    newBlogs.push({ slug, keyword: trend, url, date: new Date().toISOString() });
  }
  return newBlogs;
}