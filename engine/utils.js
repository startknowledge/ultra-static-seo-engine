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

export function cleanMarkdown(text) {
  if (!text) return '';
  return text.replace(/```[\s\S]*?```/g, '')
             .replace(/`/g, '')
             .replace(/^```html|```$/gm, '')
             .trim();
}

// ========== NEW: Automatic image generation ==========
export async function generateImage(prompt, outputPath) {
  // Try Hugging Face Stable Diffusion first (if token exists)
  const hfToken = process.env.HUGGINGFACE_TOKEN1 || process.env.HUGGINGFACE_TOKEN2;
  if (hfToken) {
    try {
      const model = "stabilityai/stable-diffusion-2-1";
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: prompt },
        {
          headers: { Authorization: `Bearer ${hfToken}` },
          responseType: 'arraybuffer',
        }
      );
      if (response.status === 200) {
        fs.writeFileSync(outputPath, response.data);
        console.log(`✅ Generated image: ${outputPath}`);
        return outputPath;
      }
    } catch (err) {
      console.warn(`Hugging Face image gen failed: ${err.message}`);
    }
  }

  // Fallback: Unsplash random image with relevant query
  const query = encodeURIComponent(prompt.split(' ').slice(0, 5).join(' '));
  const unsplashUrl = `https://source.unsplash.com/1200x630/?${query}`;
  try {
    const response = await axios.get(unsplashUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ Fallback Unsplash image: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`Unsplash fallback failed: ${err.message}`);
    return null;
  }
}