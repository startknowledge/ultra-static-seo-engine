export async function runInternalLinking(blogs) {
  blogs.forEach((b, i) => {
    if (blogs[i + 1]) {
      b.link = blogs[i + 1].slug
    }
  })
}
export function injectInternalLinks(content, links) {
  if (!links || !links.length) return content

  links.forEach(link => {
    if (!link.keyword || !link.url) return

    content = content.replace(
      new RegExp(link.keyword, "i"),
      `<a href="${link.url}">${link.keyword}</a>`
    )
  })

  return content
}