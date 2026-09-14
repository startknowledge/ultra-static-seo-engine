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

function yandexHeadCode() {
  return `
${YANDEX_MARKER}

<meta name="yandex-verification" content="${YANDEX_VERIFICATION}">

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
    webvisor:true,
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
</div>
`;
}

function yandexSidebarAds() {
  return `
<!-- Yandex Blog Sidebar Ads -->
<div class="ad-layout-wrapper">

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

</div>
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
  updateExistingBlogFiles
};