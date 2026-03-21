export function cleanContent(html) {
  const sections = [
    "Related Articles",
    "Recommended Resources",
    "Part of SEO Network"
  ]

  let cleaned = html

  sections.forEach(section => {
    const regex = new RegExp(`(${section}[\\s\\S]*?)(?=${section}|$)`, "gi")

    let match = cleaned.match(regex)
    if (match && match.length > 1) {
      // keep only first
      cleaned = cleaned.replace(regex, (m, p1, offset) => {
        return offset === cleaned.indexOf(match[0]) ? p1 : ""
      })
    }
  })

  return cleaned
}