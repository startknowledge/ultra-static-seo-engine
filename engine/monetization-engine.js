// ================= CONFIG =================

// 🔥 Google AdSense
const ADSENSE_CLIENT = "ca-pub-2162324894765763"

const ADSENSE_SLOTS = [
  "1966379200",
  "8024521099",
  "4441349363",
  "3958418735"
]

// 🔥 PropellerAds (Direct Link Ads)
const PROPELLER_SCRIPT = `
<script async src="https://upgulpinon.com/1?z=XXXXXX"></script>
`

// 🔥 Adsterra (example script)
const ADSTERRA_SCRIPT = `
<script type="text/javascript">
  atOptions = {
    'key' : 'XXXXXXX',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300
  };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/XXXXXXX/invoke.js"></script>
`

// 🔥 Media.net
const MEDIANET_SCRIPT = `
<script id="mNCC" language="javascript">
  medianet_versionId = "3121199";
</script>
<script src="https://contextual.media.net/dmedianet.js?cid=XXXXXXXX" async></script>
`

// ================= HELPERS =================

// 🎯 random AdSense slot
function getRandomSlot() {
  return ADSENSE_SLOTS[Math.floor(Math.random() * ADSENSE_SLOTS.length)]
}

// 🎯 AdSense block
function generateAdsenseAd() {
  const slot = getRandomSlot()

  return `
<ins class="adsbygoogle"
 style="display:block"
 data-ad-format="fluid"
 data-ad-client="${ADSENSE_CLIENT}"
 data-ad-slot="${slot}"></ins>

<script>
 (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`
}

// ================= AI PLACEMENT =================

// 🧠 detect content strength
function detectContentScore(content) {
  const length = content.length

  if (length > 8000) return "high"
  if (length > 3000) return "medium"
  return "low"
}

// 🧠 dynamic ad frequency
function getAdFrequency(score) {
  if (score === "high") return 4
  if (score === "medium") return 3
  return 2
}

// ================= MAIN =================

export function injectAds(content) {
  if (!content) return content

  // 🧠 AI score
  const score = detectContentScore(content)
  const adCount = getAdFrequency(score)

  // 🔥 LOAD ALL NETWORK SCRIPTS (head)
  const allScripts = `
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>

<!-- PropellerAds -->
${PROPELLER_SCRIPT}

<!-- Adsterra -->
${ADSTERRA_SCRIPT}

<!-- Media.net -->
${MEDIANET_SCRIPT}
`

  content = content.replace("</head>", `${allScripts}</head>`)

  // 📍 paragraph split
  const parts = content.split("</p>")

  let newContent = ""

  parts.forEach((part, index) => {
    newContent += part + "</p>"

    // 🎯 smart placement
    if (index % Math.floor(parts.length / adCount || 1) === 0) {
      newContent += generateAdsenseAd()
    }
  })

  // 📍 end ad
  newContent = newContent.replace("</body>", `${generateAdsenseAd()}</body>`)

  return newContent
}