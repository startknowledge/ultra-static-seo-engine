import { CONFIG } from '../config.js';
import fs from 'fs';

// Sanitise a string to be a safe filename (no spaces, quotes, colons, etc.)
export function sanitizeSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // replace non‑alphanumeric with hyphen
    .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
    .slice(0, 100);                // limit length
}

// Delay helper
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
export async function retry(fn, maxRetries = CONFIG.MAX_RETRIES, delayMs = CONFIG.RETRY_DELAY_MS) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Retry ${i + 1}/${maxRetries} failed: ${err.message}`);
      await delay(delayMs * (i + 1));   // linear backoff
    }
  }
  throw lastError;
}

// Read/write JSON files safely
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