export function generateSmartLinks(currentSlug, allPages) {
  // remove self + duplicates
  const filtered = allPages
    .filter(p => p.slug !== currentSlug)
    .slice(0, 5)

  return filtered.map(p => `
    <li>
      <a href="/blog/${p.slug}.html">
        ${p.title}
      </a>
    </li>
  `).join("")
}