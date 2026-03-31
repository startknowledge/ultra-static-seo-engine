import fs from "fs"
import { SETTINGS } from "../config/settings.js"

export function generateIndex(blogs = []) {

  if (!fs.existsSync("./docs")) fs.mkdirSync("./docs")

  const links = (blogs || []).map(b => {
    return `<li class="card">
      <a href="${b.slug}.html">${b.keyword}</a>
    </li>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${SETTINGS.siteName}</title>
<meta name="description" content="${SETTINGS.description || "Latest SEO blogs, AI tools, and online earning guides"}">

<link rel="canonical" href="${SETTINGS.domain}/">

<!-- 🔥 SEO -->
<meta name="robots" content="index, follow">

<!-- 🔥 OPEN GRAPH -->
<meta property="og:title" content="${SETTINGS.siteName}">
<meta property="og:description" content="${SETTINGS.description}">
<meta property="og:url" content="${SETTINGS.domain}">
<meta property="og:type" content="website">

<!-- 🔥 SCHEMA -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${SETTINGS.siteName}",
  "url": "${SETTINGS.domain}"
}
</script>

<!-- 🔥 ADSENSE -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SETTINGS.adsClient}"
crossorigin="anonymous"></script>

<style>
body{font-family:Arial;margin:0;background:#f5f5f5}
header{background:#111;color:#fff;padding:20px;text-align:center}
nav{background:#222;padding:10px;text-align:center}
nav a{color:#fff;margin:10px;text-decoration:none}
.container{padding:20px;max-width:900px;margin:auto}
.card{background:#fff;padding:15px;margin:10px 0;border-radius:8px}
.card a{text-decoration:none;color:#111;font-weight:bold}
footer{background:#111;color:#fff;text-align:center;padding:20px;margin-top:40px}
.btn{display:inline-block;background:#ff6600;color:#fff;padding:10px 15px;margin-top:15px;text-decoration:none;border-radius:5px}
</style>

</head>

<body>

<header>
<h1>${SETTINGS.siteName}</h1>
<p>${SETTINGS.tagline || "SEO • AI • Blogging • Make Money"}</p>
</header>

<nav>
<a href="/">Home</a>
<a href="about.html">About</a>
<a href="contact.html">Contact</a>
<a href="privacy.html">Privacy</a>
</nav>

<div class="container">

<h2>🔥 Latest Blogs</h2>

<ul>
${links || "<li>No blogs yet</li>"}
</ul>

<!-- 🔥 AD BLOCK -->
<ins class="adsbygoogle"
 style="display:block"
 data-ad-client="${SETTINGS.adsClient}"
 data-ad-slot="${SETTINGS.adsSlot}"
 data-ad-format="auto"></ins>

<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>

<!-- 🔥 AFFILIATE CTA -->
<div class="card" style="text-align:center;">
<h3>🔥 Recommended Tool</h3>
<p>Boost your SEO and earnings with this powerful tool</p>
<a href="${SETTINGS.affiliateLink}" target="_blank" class="btn">
Check Now 🚀
</a>
</div>

</div>

<footer>

<p>© ${new Date().getFullYear()} ${SETTINGS.siteName}</p>

<p>
<a href="about.html">About</a> |
<a href="contact.html">Contact</a> |
<a href="privacy.html">Privacy</a>
</p>

</footer>

</body>
</html>`

  fs.writeFileSync("./docs/index.html", html)

  console.log("✅ index.html created")
}