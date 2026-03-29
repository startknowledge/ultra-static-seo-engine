export async function runInternalLinking(blogs) {
  blogs.forEach((b, i) => {
    if (blogs[i + 1]) {
      b.link = blogs[i + 1].slug
    }
  })
}