const AD_CLIENT = "ca-pub-2162324894765763"

const AD_SLOTS = [
  "1966379200",
  "8024521099",
  "4441349363",
  "3958418735"
]

// 🔁 random slot
function getRandomSlot() {
  return AD_SLOTS[Math.floor(Math.random() * AD_SLOTS.length)]
}

// 🔥 LOAD SCRIPT ONLY ONCEs
function getAdScript() {
  return `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}" crossorigin="anonymous"></script>
`
}

// 🎯 ad block
function generateAd() {
  const slot = getRandomSlot()

  return `
<ins class="adsbygoogle"
 style="display:block"
 data-ad-format="fluid"
 data-ad-client="${AD_CLIENT}"
 data-ad-slot="${slot}"></ins>

<script>
 (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`
}

// ================= MAIN =================
export function injectAds(content) {
  if (!content) return content

  // 🔥 add script once (head ke baad)
  content = content.replace("</head>", `${getAdScript()}</head>`)

  // 📍 first paragraph
  content = content.replace("</p>", `</p>${generateAd()}`)

  // 📍 middle
  const mid = Math.floor(content.length / 2)
  content =
    content.slice(0, mid) +
    generateAd() +
    content.slice(mid)

  // 📍 end
  content = content.replace("</body>", `${generateAd()}</body>`)

  return content
}