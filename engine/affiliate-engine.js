const AFFILIATE_ID = process.env.AFFILIATE_ID || "your-default-id"

export function generateAffiliateLink(keyword) {
  const base = "https://www.amazon.in/s"
  const query = encodeURIComponent(keyword)

  return `${base}?k=${query}&tag=${AFFILIATE_ID}`
}

export function injectAffiliateLinks(content, keywords = []) {
  let modified = content

  keywords.forEach((kw) => {
    const link = generateAffiliateLink(kw)

    const anchor = `<a href="${link}" target="_blank" rel="nofollow sponsored">${kw}</a>`

    const regex = new RegExp(`\\b${kw}\\b`, "i")

    modified = modified.replace(regex, anchor)
  })

  return modified
}