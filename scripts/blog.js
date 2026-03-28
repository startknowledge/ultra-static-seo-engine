// scripts/blog.js

fetch('/data/posts.json')
  .then(res => res.json())
  .then(posts => {

    let html = "<h3>Latest Blogs</h3><ul>"

    posts.slice(-5).reverse().forEach(p => {
      html += `<li><a href="/blog/${p.slug}.html">${p.title}</a></li>`
    })

    html += "</ul>"

    document.getElementById("blog-list").innerHTML = html

  })
  .catch(() => {
    document.getElementById("blog-list").innerHTML =
      "<p>No blogs found</p>"
  })