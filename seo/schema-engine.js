import fs from "fs"

export async function generateSchema(blogs) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Auto Blog",
    "blogPost": blogs.map(b => ({
      "@type": "BlogPosting",
      "headline": b.keyword
    }))
  }

  fs.writeFileSync("./dist/schema.json", JSON.stringify(schema, null, 2))
}