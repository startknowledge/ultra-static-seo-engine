// No external API – returns relevant static trends based on keyword
export async function getTrendsForKeyword(keyword) {
  // Return a set of related search queries (static, no HTTP errors)
  const base = keyword.toLowerCase();
  const trends = [
    `${base} tips`,
    `best ${base} tools`,
    `how to ${base}`,
    `${base} 2026 guide`,
    `latest ${base} news`,
    `${base} for beginners`,
    `top ${base} resources`,
    `${base} comparison`,
    `why ${base} matters`,
    `${base} case studies`
  ];
  // Return first 5 unique ones
  return [...new Set(trends)].slice(0, 5);
}