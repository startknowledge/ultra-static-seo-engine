import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs"
import path from "path"

// ================== API KEYS ==================
const keys = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3
].filter(Boolean)

const key = keys[Math.floor(Math.random() * keys.length)]

const genAI = new GoogleGenerativeAI(key)

// ================== PATHS ==================
const ROOT = new URL("../", import.meta.url)
const BLOG_DIR = new URL("../blog/", import.meta.url)
const TEMPLATE_PATH = new URL("../templates/blog-template.html", import.meta.url)
const PROMPT_PATH = new URL("../prompts/blog-prompt.txt", import.meta.url)

// ================== HELPERS ==================

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// ✅ BULLETPROOF JSON EXTRACTOR
function extractJSON(text) {
  try {
    let clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const start = clean.indexOf("[")
    const end = clean.lastIndexOf("]")

    if (start === -1 || end === -1) {
      throw new Error("JSON not found")
    }

    return JSON.parse(clean.substring(start, end + 1))
  } catch (e) {
    console.log("❌ JSON PARSE FAILED")
    return null
  }
}

// ✅ IMAGE FALLBACK
function getImage(keyword) {
  return `https://source.unsplash.com/800x400/?${encodeURIComponent(keyword)}`
}

// ✅ SIMPLE INTERNAL LINKING
function insertInternalLinks(content, existingSlugs) {
  if (!existingSlugs.length) return content

  const words = content.split(" ")

  existingSlugs.slice(0, 3).forEach((slug, i) => {
    const pos = Math.floor((words.length / 4) * (i + 1))
    words.splice(pos, 0, `<a href="/blog/${slug}.html">${slug.replace(/-/g, " ")}</a>`)
  })

  return words.join(" ")
}

// ================== MAIN ==================

async function generateBlogs() {

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  })

  const prompt = fs.readFileSync(PROMPT_PATH, "utf8")

  // 📌 Existing blogs for linking
  const existingFiles = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).map(f => f.replace(".html", ""))
    : []

  let blogs = null

  // ✅ RETRY SYSTEM (MAX 3)
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`⚡ Attempt ${attempt}`)

    const result = await model.generateContent(prompt)
    const raw = await result.response.text()

    blogs = extractJSON(raw)

    if (blogs) break
  }

  if (!blogs) {
    console.log("🚨 FINAL FAIL: JSON not parsed")
    return
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf8")

  for (const blog of blogs) {

    if (!blog.title || !blog.content) continue

    const slug = slugify(blog.title)

    // ✅ INTERNAL LINKING
    let content = insertInternalLinks(blog.content, existingFiles)

    // ✅ IMAGE FIX
    const image = blog.image || getImage(blog.title)

    let html = template
      .replace(/{{title}}/g, blog.title)
      .replace(/{{description}}/g, blog.description || blog.title)
      .replace(/{{slug}}/g, slug)
      .replace(/{{image}}/g, image)
      .replace(/{{date}}/g, new Date().toISOString())
      .replace(/{{content}}/g, content)

    // ✅ ENSURE FOLDER EXISTS
    if (!fs.existsSync(BLOG_DIR)) {
      fs.mkdirSync(BLOG_DIR, { recursive: true })
    }

    fs.writeFileSync(
      new URL(`../blog/${slug}.html`, import.meta.url),
      html
    )

    console.log("✅ Generated:", slug)
  }

  console.log("🚀 Total Blogs Generated:", blogs.length)
}

generateBlogs()
