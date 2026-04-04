import fs from 'fs';
import axios from 'axios';
import { CONFIG } from '../config.js';

export function sanitizeSlug(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function retry(fn, maxRetries = CONFIG.MAX_RETRIES, baseDelay = CONFIG.RETRY_DELAY_MS) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateLimit = err.response?.status === 429 || err.message?.includes('429');
      const delayMs = isRateLimit ? baseDelay * Math.pow(2, i) : baseDelay * (i + 1);
      console.warn(`Retry ${i+1}/${maxRetries} failed: ${err.message}. Waiting ${delayMs}ms`);
      await delay(delayMs);
    }
  }
  throw lastError;
}

export function readJson(file, defaultValue = []) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return data.trim() ? JSON.parse(data) : defaultValue;
    }
  } catch (err) {
    console.error(`Failed to read ${file}:`, err.message);
  }
  return defaultValue;
}

export function writeJson(file, data) {
  const dir = file.substring(0, file.lastIndexOf('/'));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function cleanMarkdown(text) {
  if (!text) return '';
  return text.replace(/```[\s\S]*?```/g, '')
             .replace(/`/g, '')
             .replace(/^```html|```$/gm, '')
             .trim();
}

// Generate image with multiple fallbacks
export async function generateImage(prompt, outputPath) {
  // 1. Try Unsplash (fast, no key)
  const query = encodeURIComponent(prompt.split(' ').slice(0, 5).join(' '));
  try {
    const unsplashUrl = `https://source.unsplash.com/1200x630/?${query}`;
    const res = await axios.get(unsplashUrl, { responseType: 'arraybuffer', timeout: 10000 });
    if (res.status === 200 && res.data.length > 1000) {
      fs.writeFileSync(outputPath, res.data);
      console.log(`✅ Unsplash image: ${outputPath}`);
      return outputPath;
    }
  } catch (err) {
    console.warn(`Unsplash failed: ${err.message}`);
  }

  // 2. Create a nice SVG placeholder (always works)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#1a73e8"/>
    <text x="600" y="315" font-size="36" fill="white" text-anchor="middle" font-family="Arial, sans-serif" dominant-baseline="middle">${prompt.substring(0, 60)}</text>
    <text x="600" y="380" font-size="24" fill="#e0e0e0" text-anchor="middle" font-family="Arial, sans-serif">${new Date().toLocaleDateString()}</text>
  </svg>`;
  fs.writeFileSync(outputPath, svg);
  console.log(`✅ Placeholder SVG: ${outputPath}`);
  return outputPath;
}