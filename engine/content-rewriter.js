import { generateAIContent } from './strategy-engine.js';
import fs from 'fs';
//dfgdfgd
export async function refreshOldBlogs(repoName, maxAgeDays = 90) {
  const blogDir = `./docs/${repoName}/blog`;
  if (!fs.existsSync(blogDir)) return;
  const now = Date.now();
  const files = fs.readdirSync(blogDir);
  for (const file of files) {
    const filePath = `${blogDir}/${file}`;
    const stats = fs.statSync(filePath);
    const ageDays = (now - stats.mtimeMs) / (1000*60*60*24);
    if (ageDays > maxAgeDays) {
      console.log(`♻️ Refreshing ${file}`);
      let content = fs.readFileSync(filePath, 'utf-8');
      const prompt = `Rewrite the following blog post to make it fresh and updated: ${content.substring(0, 500)}`;
      const newContent = await generateAIContent(prompt);
      if (newContent) fs.writeFileSync(filePath, newContent);
    }
  }
}