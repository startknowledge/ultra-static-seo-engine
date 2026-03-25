export function generateFallback(keyword) {

  const title = `${keyword} - Complete Guide 2026`

  const content = `
  <h1>${keyword}</h1>

  <p>${keyword} is one of the most important topics in SEO today.</p>

  <h2>What is ${keyword}?</h2>
  <p>This guide explains everything about ${keyword} in simple terms.</p>

  <h2>Why ${keyword} matters</h2>
  <p>It helps improve rankings, traffic, and authority.</p>

  <h2>Best Practices</h2>
  <ul>
    <li>Use proper keywords</li>
    <li>Create quality content</li>
    <li>Optimize structure</li>
  </ul>

  <h2>Conclusion</h2>
  <p>${keyword} is essential for long-term SEO success.</p>
  `

  return {
    title,
    description: `Learn ${keyword} with this complete guide.`,
    content,
    keywords: [keyword]
  }
}