import fs from 'fs';

// Generate dynamic CSS based on repo name (could be enhanced with AI)
export async function generateCSS(repoName) {
  // Simple but effective: derive colours from repo name hash
  let hash = 0;
  for (let i = 0; i < repoName.length; i++) {
    hash = ((hash << 5) - hash) + repoName.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash % 360);
  const primaryColor = `hsl(${hue}, 70%, 50%)`;
  const secondaryColor = `hsl(${hue}, 50%, 40%)`;

  const css = `/* Dynamic CSS for ${repoName} */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  background: #f9f9f9;
  color: #333;
}
header {
  background: ${primaryColor};
  color: white;
  padding: 1rem;
  text-align: center;
}
nav a {
  color: white;
  margin: 0 0.5rem;
  text-decoration: none;
}
nav a:hover {
  text-decoration: underline;
}
main {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}
footer {
  text-align: center;
  padding: 1rem;
  background: ${secondaryColor};
  color: white;
}
h1, h2, h3 {
  color: ${primaryColor};
}
a {
  color: ${primaryColor};
}
ins.adsbygoogle {
  margin: 2rem 0;
  display: block;
}
`;

  const docsDir = `./docs/${repoName}`;
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(`${docsDir}/style.css`, css);
}