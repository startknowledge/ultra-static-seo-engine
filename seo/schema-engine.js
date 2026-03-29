import fs from "fs"
import { SETTINGS } from "../config/settings.js"

export async function generateSchema(blogs) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": SETTINGS.siteName,
        "url": SETTINGS.domain
      },
      {
        "@type": "Organization",
        "name": SETTINGS.siteName,
        "url": SETTINGS.domain
      },
      ...blogs.map(b => ({
        "@type": "BlogPosting",
        "headline": b.keyword,
        "url": b.url,
        "datePublished": b.date,
        "author": {
          "@type": "Organization",
          "name": SETTINGS.siteName
        }
      }))
    ]
  }

  fs.writeFileSync("./dist/schema.json", JSON.stringify(schema, null, 2))
}