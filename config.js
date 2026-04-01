export const CONFIG = {
  // GitHub organisation (or user) to scan for repos
  GITHUB_ORG: "startknowledge-org",   // change to your org

  // Domain pattern: https://{repo}.startknowledge.in (default)
  DOMAIN_TEMPLATE: (repo) => `https://${repo}.startknowledge.in`,

  // AI settings
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 20000,

  // Blog generation
  BLOGS_PER_REPO: 5,              // how many new blogs per run
  MIN_CONTENT_LENGTH: 3500,        // discard too short AI output
  BLOG_RETENTION_DAYS: 90,
  
  // Ads
  ADSENSE_CLIENT: "ca-pub-2162324894765763",
  ADSENSE_SLOTS: ["1966379200", "8024521099", "4441349363", "3958418735"],
  PROPELLER_SCRIPT: `<script async src="https://upgulpinon.com/1?z=XXXXXX"></script>`,
  ADSTERRA_SCRIPT: `<script type="text/javascript">atOptions = {'key' : 'XXXXXXX','format' : 'iframe','height' : 250,'width' : 300};</script><script type="text/javascript" src="//www.highperformanceformat.com/XXXXXXX/invoke.js"></script>`,
  MEDIANET_SCRIPT: `<script id="mNCC" language="javascript">medianet_versionId = "3121199";</script><script src="https://contextual.media.net/dmedianet.js?cid=XXXXXXXX" async></script>`,
};