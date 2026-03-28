import fs from "fs"

const BLOG_DIR = "./blog"

export function cleanBadBlogs() {

  if (!fs.existsSync(BLOG_DIR)) return

  const files = fs.readdirSync(BLOG_DIR)

  for (const file of files) {

    const path = `${BLOG_DIR}/${file}`

    const content = fs.readFileSync(path, "utf-8")

    // ❌ delete bad files
    if (
      file.includes("404") ||
      content.length < 500 ||
      content.includes("Error") ||
      content.includes("Not Found")
    ) {
      fs.unlinkSync(path)
      console.log("🗑 Deleted:", file)
    }
  }
}