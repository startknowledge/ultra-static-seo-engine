export function analyzeSERP(keyword) {
  return {
    hasFeaturedSnippet: Math.random() > 0.5,
    hasVideoResults: Math.random() > 0.5,
    hasAds: Math.random() > 0.7
  };
}