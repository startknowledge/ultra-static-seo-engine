import fs from 'fs';
import path from 'path';

const blogDir = './blog';
const files = fs.readdirSync(blogDir);

const blogs = files
  .filter(f => f.endsWith('.html'))
  .map(file => ({
    slug: file.replace('.html',''),
    title: file.replace('.html','').replace(/-/g,' ')
  }));

fs.writeFileSync(
  './blog/index.json',
  JSON.stringify(blogs, null, 2)
);

console.log("✅ Blog index generated");