import fs from 'fs';

export async function buildTopicClusters(repoName, allBlogs) {
  // Group blogs by topic (simple keyword matching)
  const clusters = {};
  for (const blog of allBlogs) {
    const words = blog.keyword.split(' ');
    const mainTopic = words[0]; // naive
    if (!clusters[mainTopic]) clusters[mainTopic] = [];
    clusters[mainTopic].push(blog);
  }
  // Generate pillar page for each cluster
  for (const [topic, blogs] of Object.entries(clusters)) {
    const pillarHtml = `<h1>Ultimate Guide to ${topic}</h1><ul>${blogs.map(b => `<li><a href="${b.url}">${b.keyword}</a></li>`).join('')}</ul>`;
    fs.writeFileSync(`./docs/${repoName}/pillar-${sanitizeSlug(topic)}.html`, pillarHtml);
  }
}

export async function crossLinkRepos(allRepos) {
  // Create a central hub page that links to all repos
  const hubHtml = `<h1>StartKnowledge Network</h1><ul>${allRepos.map(r => `<li><a href="/${r}/">${r}</a></li>`).join('')}</ul>`;
  fs.writeFileSync('./docs/network-hub.html', hubHtml);
  // Also add backlinks from each repo to the hub
  for (const repo of allRepos) {
    const indexPath = `./docs/${repo}/index.html`;
    if (fs.existsSync(indexPath)) {
      let index = fs.readFileSync(indexPath, 'utf-8');
      index = index.replace('</body>', `<div class="network-link"><a href="/network-hub.html">View all StartKnowledge sites</a></div></body>`);
      fs.writeFileSync(indexPath, index);
    }
  }
}