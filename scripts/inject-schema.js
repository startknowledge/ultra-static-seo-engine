import fs from 'fs';
import path from 'path';

// Folders to inject schema into
const folders = [
  './blog',
  './pages'
];

// Base schema for site-wide info
const baseSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "url": "https://ultrastaticseoengine.startknowledge.in",
      "name": "Ultra Advanced Automatic Static SEO Engine",
      "description": "Ultra Static SEO Engine automatically generates blogs, sitemap, RSS, schema markup and SEO pages for static websites using GitHub and Cloudflare automation.",
      "publisher": {
        "@type": "Organization",
        "name": "StartKnowledge",
        "logo": {
          "@type": "ImageObject",
          "url": "https://ultrastaticseoengine.startknowledge.in/assets/images/favicon.svg"
        }
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://ultrastaticseoengine.startknowledge.in/blog/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://ultrastaticseoengine.startknowledge.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://ultrastaticseoengine.startknowledge.in/blog/"
        }
      ]
    },
    {
      "@type": "Organization",
      "name": "StartKnowledge",
      "url": "https://startknowledge.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ultrastaticseoengine.startknowledge.in/assets/images/favicon.svg"
      }
    }
  ]
};

// Function to generate BlogPosting schema for a blog
const generateBlogPostingSchema = (slug, title) => ({
  "@type": "BlogPosting",
  "headline": title,
  "url": `https://ultrastaticseoengine.startknowledge.in/blog/${slug}.html`,
  "author": {
    "@type": "Organization",
    "name": "StartKnowledge"
  },
  "publisher": {
    "@type": "Organization",
    "name": "StartKnowledge",
    "logo": {
      "@type": "ImageObject",
      "url": "https://ultrastaticseoengine.startknowledge.in/assets/images/favicon.svg"
    }
  },
  "datePublished": new Date().toISOString()
});

folders.forEach(folder => {
  if (!fs.existsSync(folder)) return;

  const files = fs.readdirSync(folder).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const filePath = path.join(folder, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if schema already exists
    if (content.includes('application/ld+json')) {
      console.log(`ℹ️ Schema already present: ${filePath}`);
      return;
    }

    // Start with base schema
    const graph = [...baseSchema["@graph"]];

    // If blog folder, add BlogPosting
    if (folder.includes('blog')) {
      const slug = file.replace('.html', '');
      const title = slug.replace(/-/g, ' ');
      graph.push(generateBlogPostingSchema(slug, title));
    }

    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}\n</script>`;

    // Inject before </head>
    content = content.replace('</head>', `${schemaScript}\n</head>`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Schema injected: ${filePath}`);
  });
});