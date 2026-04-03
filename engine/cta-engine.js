export function generateCTRTitle(originalTitle, keyword) {
  const templates = [
    `${keyword}: The Ultimate Guide (2026)`,
    `10 Secrets About ${keyword} You Need to Know`,
    `How to Master ${keyword} in 5 Easy Steps`,
    `Why ${keyword} Is Going Viral – Don't Miss Out`,
    `The Truth About ${keyword} – Exposed!`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function injectCTAs(html) {
  const ctaButton = `<div class="cta-button" style="text-align:center;margin:2rem 0;"><a href="#" class="btn" style="background:#ff5722;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Get Started Now →</a></div>`;
  // Insert after first paragraph
  return html.replace('</p>', `</p>${ctaButton}`);
}