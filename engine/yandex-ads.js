// ============================================================
// YANDEX ADS — BLOG ONLY
// ============================================================

const fs = require('fs-extra');

const YANDEX_VERIFICATION = '0ae289ffbdd5be48';
const YANDEX_PAGE_ID = '20036618';
const YANDEX_METRIKA_ID = '112528906';

const YANDEX_BLOCK_TOP = 'R-A-20036618-12';
const YANDEX_BLOCK_LEFT = 'R-A-20036618-13';
const YANDEX_BLOCK_RIGHT = 'R-A-20036618-14';

const YANDEX_MARKER = '<!-- ULTRA-ENGINE-YANDEX-BLOG-ADS -->';

// ⭐ Inline CSS (external file की ज़रूरत नहीं — हर repo में काम करेगा)
const YANDEX_INLINE_CSS = `<style>
.yandex-ad-container{background:transparent;border-radius:12px;padding:0;margin:25px auto;max-width:100%;overflow:hidden;text-align:center;transition:all .3s ease}
.yandex-ad-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;text-align:center;margin-bottom:8px}
[id^="yandex_rtb"]{min-height:90px;display:block;width:100%;max-width:100%}
.yandex-sidebar-ad{position:fixed;top:120px;width:160px;z-index:100;display:none;background:transparent;padding:0;transition:all .3s ease}
.ad-sidebar-left{left:15px}
.ad-sidebar-right{right:15px}
.yandex-sidebar-ad .yandex-ad-label{font-size:9px;margin-bottom:6px}
@media(min-width:1400px){.yandex-sidebar-ad{display:block}}
@media(max-width:1399px){.yandex-sidebar-ad{display:none !important}}
@media(max-width:768px){
.yandex-ad-container{padding:5px;margin:12px auto;border-radius:6px;max-height:130px;overflow:hidden}
.yandex-ad-label{font-size:8px;letter-spacing:.5px;margin-bottom:4px}
.yandex-blog-top-ad{max-height:120px}
[id^="yandex_rtb"]{min-height:70px;max-height:110px;overflow:hidden}
}
@media(max-width:480px){
.yandex-ad-container{padding:4px;margin:10px auto;max-height:115px}
[id^="yandex_rtb"]{min-height:60px;max-height:95px}
.yandex-ad-label{font-size:7px}
}
@media(min-width:769px){
.yandex-ad-container{max-height:none}
[id^="yandex_rtb"]{max-height:none;min-height:90px}
}
.ad-fallback{padding:20px;background:#f5f5f5;color:#999;font-size:12px;border-radius:8px}
</style>`;

function yandexHeadCode() {
  return `
${YANDEX_MARKER}

<meta name="yandex-verification" content="${YANDEX_VERIFICATION}">

${YANDEX_INLINE_CSS}

<!-- Yandex Autoplacement -->
<script src="https://yandex.ru/ads/system/context.js" async></script>
<script data-page-id="${YANDEX_PAGE_ID}" src="https://yandex.ru/ads/system/ap-loader.js" async></script>

<!-- Yandex.RTB -->
<script>
window.yaContextCb = window.yaContextCb || [];
</script>

<!-- Yandex.Metrika -->
<script type="text/javascript">
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){
        (m[i].a=m[i].a||[]).push(arguments)
    };
    m[i].l=1*new Date();

    for(var j=0;j<document.scripts.length;j++){
        if(document.scripts[j].src===r){
            return;
        }
    }

    k=e.createElement(t);
    a=e.getElementsByTagName(t)[0];
    k.async=1;
    k.src=r;
    a.parentNode.insertBefore(k,a);
})(window,document,'script','https://mc.webvisor.org/metrika/tag_ww.js?id=${YANDEX_METRIKA_ID}','ym');

ym(${YANDEX_METRIKA_ID},'init',{
    ssr:true,
    webvisor:false,
    trackHash:true,
    clickmap:true,
    ecommerce:"dataLayer",
    referrer:document.referrer,
    url:location.href,
    accurateTrackBounce:true,
    trackLinks:true
});
</script>

<noscript>
<div>
<img
src="https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}"
style="position:absolute;left:-9999px;"
alt=""
>
</div>
</noscript>
<!-- /Yandex.Metrika -->
`;
}

function yandexTopAd() {
  return `
<!-- Yandex Blog Top Ad -->
<div class="yandex-ad-container yandex-blog-top-ad">
  <div class="yandex-ad-label">Advertisement</div>

  <div id="yandex_rtb_${YANDEX_BLOCK_TOP}"></div>

  <script>
  window.yaContextCb.push(() => {
      Ya.Context.AdvManager.render({
          blockId: "${YANDEX_BLOCK_TOP}",
          renderTo: "yandex_rtb_${YANDEX_BLOCK_TOP}"
      });
  });
  </script>

  <noscript>
    <div class="ad-fallback">Ad blocked or JS disabled</div>
  </noscript>
</div>
`;
}

function yandexSidebarAds() {
  return `
<!-- Yandex Blog Sidebar Ads -->

  <aside class="yandex-sidebar-ad ad-sidebar-left">
    <div class="yandex-ad-label">Advertisement</div>

    <div id="yandex_rtb_${YANDEX_BLOCK_LEFT}"></div>

    <script>
    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            blockId: "${YANDEX_BLOCK_LEFT}",
            renderTo: "yandex_rtb_${YANDEX_BLOCK_LEFT}"
        });
    });
    </script>
  </aside>

  <aside class="yandex-sidebar-ad ad-sidebar-right">
    <div class="yandex-ad-label">Advertisement</div>

    <div id="yandex_rtb_${YANDEX_BLOCK_RIGHT}"></div>

    <script>
    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            blockId: "${YANDEX_BLOCK_RIGHT}",
            renderTo: "yandex_rtb_${YANDEX_BLOCK_RIGHT}"
        });
    });
    </script>
  </aside>
<!-- End Yandex Blog Sidebar Ads -->
`;
}

function injectYandexBlogAds(html) {
  if (!html || typeof html !== 'string') return html;

  // Already installed
  if (html.includes(YANDEX_MARKER)) {
    return html;
  }

  let result = html;

  // HEAD
  if (result.includes('</head>')) {
    result = result.replace(
      '</head>',
      `${yandexHeadCode()}\n</head>`
    );
  }

  // TOP BODY AD
  if (result.includes('<body')) {
    const bodyMatch = result.match(/<body\b[^>]*>/i);

    if (bodyMatch) {
      result = result.replace(
        bodyMatch[0],
        `${bodyMatch[0]}\n${yandexTopAd()}`
      );
    }
  }

  // SIDEBARS
  if (result.includes('</body>')) {
    result = result.replace(
      '</body>',
      `${yandexSidebarAds()}\n</body>`
    );
  }

  return result;
}

// ============================================================
// MIGRATION — Purane blogs में inline CSS add करें
// जिनमें marker है लेकिन inline CSS नहीं
// ============================================================

function migrateOldBlogsCss(repoPath) {
  const blogDir = `${repoPath}/blog`;
  if (!fs.existsSync(blogDir)) return 0;

  const files = fs.readdirSync(blogDir);
  let fixed = 0;

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.html')) continue;

    const filePath = `${blogDir}/${file}`;
    try {
      let html = fs.readFileSync(filePath, 'utf8');

      // Skip अगर marker नहीं है (non-Yandex blog)
      if (!html.includes(YANDEX_MARKER)) continue;

      // Skip अगर inline CSS already है
      if (html.includes('.yandex-ad-container{background:transparent')) continue;

      // External CSS link हटाएँ (अगर है)
      html = html.replace(/<link[^>]*yandex-ads\.css[^>]*>\s*/gi, '');

      // Marker के तुरंत बाद inline CSS add करें
      html = html.replace(
        YANDEX_MARKER,
        `${YANDEX_MARKER}\n${YANDEX_INLINE_CSS}`
      );

      fs.writeFileSync(filePath, html, 'utf8');
      fixed++;
      console.log(`🎨 Yandex CSS migrated: blog/${file}`);
    } catch (error) {
      console.warn(`⚠️ CSS migration failed for ${file}:`, error.message);
    }
  }

  return fixed;
}

function updateExistingBlogFiles(repoPath) {
  const blogDir = `${repoPath}/blog`;

  if (!fs.existsSync(blogDir)) {
    return 0;
  }

  let updated = 0;

  const files = fs.readdirSync(blogDir);

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.html')) {
      continue;
    }

    const filePath = `${blogDir}/${file}`;

    try {
      let html = fs.readFileSync(filePath, 'utf8');

      if (html.includes(YANDEX_MARKER)) {
        continue;
      }

      html = injectYandexBlogAds(html);

      fs.writeFileSync(filePath, html, 'utf8');

      updated++;

      console.log(`📢 Yandex Ads added: blog/${file}`);
    } catch (error) {
      console.warn(
        `⚠️ Yandex Ads update failed for ${file}:`,
        error.message
      );
    }
  }

  return updated;
}

module.exports = {
  injectYandexBlogAds,
  updateExistingBlogFiles,
  migrateOldBlogsCss,
  YANDEX_MARKER
};