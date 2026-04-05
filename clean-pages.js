const fs = require('fs-extra');
const path = require('path');

async function cleanPages() {
  const docsDir = 'docs';
  const dirs = fs.readdirSync(docsDir);
  for (const dir of dirs) {
    const pagesPath = path.join(docsDir, dir, 'pages');
    if (fs.existsSync(pagesPath)) {
      fs.removeSync(pagesPath);
      console.log(`🗑️ Deleted ${pagesPath}`);
    }
  }
}

cleanPages();