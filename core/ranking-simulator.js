export function simulateRanking({
  keyword,
  contentLength,
  domainAuthority,
  backlinks,
  seoScore
}) {
  let score = 0;

  // Content strength
  if (contentLength > 1500) score += 20;
  else if (contentLength > 1000) score += 10;

  // Authority
  score += domainAuthority * 0.3;

  // Backlinks
  score += backlinks * 2;

  // SEO optimization
  score += seoScore * 0.5;

  // Random SERP fluctuation
  score += Math.random() * 10;

  // Convert to ranking (lower is better)
  const position = Math.max(1, 100 - Math.floor(score));

  return {
    keyword,
    estimatedPosition: position,
    score
  };
}