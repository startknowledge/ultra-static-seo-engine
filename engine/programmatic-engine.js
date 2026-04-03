import { sanitizeSlug } from './utils.js';
import fs from 'fs';

// Example: generate location pages for a service
export async function generateLocationPages(repoName, domain, baseKeyword, locations) {
  const progDir = `./docs/${repoName}/programmatic`;
  if (!fs.existsSync(progDir)) fs.mkdirSync(progDir, { recursive: true });
  const pages = [];
  for (const loc of locations.slice(0, CONFIG.PROGRAMMATIC_PAGES_PER_KEYWORD)) {
    const title = `${baseKeyword} in ${loc}`;
    const slug = sanitizeSlug(title);
    const content = `<h1>${title}</h1><p>Best ${baseKeyword} services in ${loc}. Contact us for a free quote.</p>`;
    const html = `<!DOCTYPE html><html><head><title>${title}</title><link rel="stylesheet" href="/${repoName}/style.css"></head><body>${content}</body></html>`;
    fs.writeFileSync(`${progDir}/${slug}.html`, html);
    pages.push({ slug, url: `${domain}/programmatic/${slug}.html` });
  }
  return pages;
}