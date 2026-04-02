import fs from 'fs';
import { CONFIG } from '../config.js';

export function sanitizeSlug(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function retry(fn, maxRetries = CONFIG.MAX_RETRIES, delayMs = CONFIG.RETRY_DELAY_MS) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Retry ${i+1}/${maxRetries} failed: ${err.message}`);
      await delay(delayMs * (i+1));
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

// Remove markdown code fences and stray backticks from AI text
export function cleanMarkdown(text) {
  if (!text) return '';
  return text.replace(/```[\s\S]*?```/g, '')
             .replace(/`/g, '')
             .replace(/^```html|```$/gm, '')
             .trim();
}