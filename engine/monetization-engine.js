// ================= ADS CONFIG =================
const AD_CLIENT = "ca-pub-2162324894765763"

const AD_SLOTS = [
  "1966379200",
  "8024521099",
  "4441349363",
  "3958418735"
]

// 🔁 random slot selector
function getRandomSlot() {
  return AD_SLOTS[Math.floor(Math.random() * AD_SLOTS.length)]
}

// 🎯 ad block generator
function generateAd() {
  const slot = getRandomSlot()

  return `
<!-- ADS START -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}" crossorigin="anonymous"></script>

<ins class="adsbygoogle"
 style="display:block"
 data-ad-format="fluid"
 data-ad-client="${AD_CLIENT}"
 data-ad-slot="${slot}"></ins>

<script>
 (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- ADS END -->
`
}

// ================= MAIN INJECT =================
export function injectAds(content) {
  if (!content) return content

  // 📍 position 1: first paragraph ke baad
  content = content.replace("</p>", `</p>${generateAd()}`)

  // 📍 position 2: middle (approx)
  const midIndex = Math.floor(content.length / 2)
  content =
    content.slice(0, midIndex) +
    generateAd() +
    content.slice(midIndex)

  // 📍 position 3: end se pehle
  content = content.replace("</body>", `${generateAd()}</body>`)

  return content
}