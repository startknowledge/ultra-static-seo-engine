import { generateAIContent } from './strategy-engine.js';
import { sanitizeSlug } from './utils.js';
import fs from 'fs';

// High CPC buyer intent keywords
const BUYER_INTENT_KEYWORDS = [
  "best", "review", "vs", "top", "buy", "cheap", "discount", "affordable",
  "price", "cost", "compare", "alternative", "pros and cons"
];

export async function detectBuyerIntent(keyword) {
  return BUYER_INTENT_KEYWORDS.some(term => keyword.toLowerCase().includes(term));
}

export async function generateComparisonTable(product1, product2, features) {
  return `
<div class="comparison-table">
  <table>
    <tr><th>Feature</th><th>${product1}</th><th>${product2}</th></tr>
    ${features.map(f => `<tr><td>${f.name}</td><td>${f.val1}</td><td>${f.val2}</td></tr>`).join('')}
  </table>
</div>`;
}

export async function generateMoneyPage(repoName, domain, keyword) {
  const prompt = `Write a detailed buyer's guide for "${keyword}". Include pros/cons, pricing, a comparison table of top 3 products, and affiliate-friendly recommendations. Use HTML for the comparison table.`;
  let content = await generateAIContent(prompt);
  // Insert affiliate links automatically (replace placeholder URLs)
  content = content.replace(/https:\/\/amzn\.to\/XXXX/g, CONFIG.AFFILIATE_NETWORKS.amazon + "product-id");
  // Add CTA buttons
  content += `<div class="cta-button"><a href="${CONFIG.AFFILIATE_NETWORKS.amazon}" class="btn">Check Price on Amazon</a></div>`;
  return content;
}

export async function generateMoneyPagesForRepo(repoName, domain, keywords) {
  const moneyDir = `./docs/${repoName}/money`;
  if (!fs.existsSync(moneyDir)) fs.mkdirSync(moneyDir, { recursive: true });
  const pages = [];
  for (const kw of keywords.slice(0, CONFIG.MONEY_PAGES_PER_REPO)) {
    if (!await detectBuyerIntent(kw)) continue;
    const slug = sanitizeSlug(kw) + "-buyers-guide";
    const content = await generateMoneyPage(repoName, domain, kw);
    const html = `<!DOCTYPE html><html><head><title>${kw} – Buyer's Guide</title><link rel="stylesheet" href="/${repoName}/style.css"></head><body>${content}</body></html>`;
    fs.writeFileSync(`${moneyDir}/${slug}.html`, html);
    pages.push({ slug, url: `${domain}/money/${slug}.html` });
  }
  return pages;
}