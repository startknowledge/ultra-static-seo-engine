import fs from "fs"
import { SETTINGS } from "../config/settings.js"

export function generateIndex(blogs = []) {

  if (!fs.existsSync("./docs")) fs.mkdirSync("./docs")

  const links = blogs.map(b => {
    return `<li><a href="${b.slug}.html">${b.keyword}</a></li>`
  }).join("")

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${SETTINGS.siteName}</title>
<meta name="description" content="Latest SEO blogs, AI tools, and online earning guides">

<link rel="canonical" href="${SETTINGS.domain}/">

<!-- 🔥 SEO -->
<meta name="robots" content="index, follow">

<!-- 🔥 OPEN GRAPH -->
<meta property="og:title" content="${SETTINGS.siteName}">
<meta property="og:description" content="SEO, AI tools, blogging and earning guides">
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
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2162324894765763"
crossorigin="anonymous"></script>

<style>
body{font-family:Arial;margin:0;background:#f5f5f5}
header{background:#111;color:#fff;padding:20px;text-align:center}
nav{background:#222;padding:10px;text-align:center}
nav a{color:#fff;margin:10px;text-decoration:none}
.container{padding:20px}
.card{background:#fff;padding:15px;margin:10px 0;border-radius:8px}
footer{background:#111;color:#fff;text-align:center;padding:20px;margin-top:40px}
</style>

</head>

<body>

<header>
<h1>${SETTINGS.siteName}</h1>
<p>SEO • AI • Blogging • Make Money</p>
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

<!-- 🔥 AD -->
<ins class="adsbygoogle"
 style="display:block"
 data-ad-client="ca-pub-2162324894765763"
 data-ad-slot="1966379200"
 data-ad-format="auto"></ins>

<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>
<a href="https://your-affiliate-link.com" target="_blank">
🔥 Best Tool Recommendation
</a>
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
</html>
`

  fs.writeFileSync("./docs/index.html", html)

  console.log("✅ index.html created")
}