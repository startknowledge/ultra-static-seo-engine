export const CONFIG = {
  GITHUB_ORG: "startknowledge",
  DOMAIN_MAP: {
    "ai-mosaic-studio": "https://aimosaicstudio.startknowledge.in",
    "bn-ration-scale": "https://bnrationscale.startknowledge.in",
    "Calculator-Library-Portal": "https://calculatorlibraryportal.startknowledge.in",
    "design-painting": "https://designpainting.startknowledge.in",
    "Motionix": "https://motionix.startknowledge.in",
    "pension-calculator": "https://pencalculator.startknowledge.in",
    "startknowledge": "https://www.startknowledge.in",
    "ultra-static-seo-engine": "https://ultrastaticseoengine.startknowledge.in"
  },
  DOMAIN_TEMPLATE: (repo) => `https://${repo}.startknowledge.in`,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 30000,
  BLOGS_PER_REPO: 2,
  MIN_CONTENT_LENGTH: 500,
  BLOG_RETENTION_DAYS: 90,
  TREND_SOURCES: ["google"],   // only google (reliable)
  ADSENSE_CLIENT: "ca-pub-2162324894765763",
  ADSENSE_SLOTS: ["1966379200", "8024521099", "4441349363", "3958418735"],
  PROPELLER_SCRIPT: `<script async src="https://upgulpinon.com/1?z=XXXXXX"></script>`,
  ADSTERRA_SCRIPT: `<script type="text/javascript">atOptions = {'key' : 'XXXXXXX','format' : 'iframe','height' : 250,'width' : 300};</script><script type="text/javascript" src="//www.highperformanceformat.com/XXXXXXX/invoke.js"></script>`,
  MEDIANET_SCRIPT: `<script id="mNCC" language="javascript">medianet_versionId = "3121199";</script><script src="https://contextual.media.net/dmedianet.js?cid=XXXXXXXX" async></script>`,
  AFFILIATE_NETWORKS: {
  amazon: "https://amzn.to/",
  cj: "https://www.anrdoezrs.net/",
  shareasale: "https://shareasale.com/r.cfm?",
  impact: "https://impact.com/track/click?",
  rakuten: "https://click.linksynergy.com/deeplink?id=XXXXXXXX&mid=YYYYYYYY&u1=ZZZZZZZZ",
  awin: "https://www.awin1.com/cread.php?awinmid=XXXXXXXX&awinaffid=YYYYYYYY&clickref=ZZZZZZZZ&p=",
  flexoffers: "https://www.flexoffers.com/go/",
  viglink: "https://redirect.viglink.com?key=XXXXXXXX&u=YYYYYYYY"},
  
};