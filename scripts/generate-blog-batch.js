import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs"

// Random Gemini API key
const keys = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3
]

const key = keys[Math.floor(Math.random() * keys.length)]

const genAI = new GoogleGenerativeAI(key)

// Safe JSON extractor
function extractJSON(text) {

  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")

  if (start === -1 || end === -1) {
    throw new Error("JSON not found in AI response")
  }

  return text.substring(start, end + 1)
}

async function generateBlogs() {

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  })

  const prompt = `
Generate 10 SEO blog posts.

Return ONLY JSON array.

Format:
[
{
"title":"...",
"slug":"...",
"content":"..."
}
]

Content must be HTML.
`

  const result = await model.generateContent(prompt)
  const response = await result.response

  const raw = response.text()

  let blogs = []

  try {

    const cleanJSON = extractJSON(raw)
    blogs = JSON.parse(cleanJSON)

  } catch (e) {

    console.log("JSON parse error")
    console.log(e)
    return
  }

  for (const blog of blogs) {

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">

<title>${blog.title}</title>

</head>

<body>

<header>
<h1>${blog.title}</h1>

<form>
<input 
type="text"
id="search"
name="search"
placeholder="Search articles..."
autocomplete="off"
autofocus
>
</form>

</header>

<main>

${blog.content}

</main>

</body>
</html>
`

    fs.writeFileSync(`blog/${blog.slug}.html`, html)

  }

  console.log("Blogs Generated:", blogs.length)
}

generateBlogs()
