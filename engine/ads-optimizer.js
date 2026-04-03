import { CONFIG } from '../config.js';

export function optimizeAds(html, contentLength, userCountry) {
  // Already have injectAds function; we enhance it with RPM logic
  let adCount = 2;
  if (contentLength > 8000) adCount = 4;
  else if (contentLength > 4000) adCount = 3;
  // High RPM countries: US, UK, CA, AU
  const highRpmCountries = ['US', 'GB', 'CA', 'AU'];
  if (highRpmCountries.includes(userCountry)) adCount += 1;
  // Insert more ads in money pages
  if (html.includes('buyers-guide')) adCount += 2;
  return injectAdsWithCount(html, adCount);
}

function injectAdsWithCount(html, adCount) {
  // Same as injectAds but with dynamic count
  // (reuse your existing injectAds logic)
  return html;
}