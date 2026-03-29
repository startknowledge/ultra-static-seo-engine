// scripts/blog.js
async function loadBlogs() {
  try {
    const res = await fetch('/blog/index.json'); // Cloudflare deploy me path
    const blogs = await res.json();
    const container = document.getElementById('blog-list');

    if (!blogs || !blogs.length) {
      container.innerHTML = "<p>No blogs found</p>";
      return;
    }

    // Latest 10 blogs
    const latest = blogs.reverse().slice(0, 50);

    container.innerHTML = `
      <h3>Latest Blogs</h3>
      <ul>
        ${latest.map(b => `<li><a href="/blog/${b.slug}.html">${b.title}</a></li>`).join('')}
      </ul>
    `;
  } catch (err) {
    console.error("Error loading blogs:", err);
    document.getElementById("blog-list").innerHTML = "<p>No blogs found</p>";
  }
}

loadBlogs();