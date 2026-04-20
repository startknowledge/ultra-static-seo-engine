const fs = require('fs-extra');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'clickbank-products.json');
const CSV_FILE = path.join(__dirname, '..', 'money-keywords.csv');
const COUNT = 3; // Number of products to show per repo

// Map each repository to a ClickBank niche (as defined in your JSON)
const REPO_NICHE_MAP = {
  'startknowledge': 'E-Business & E-Marketing',
  'bn-ration-scale': 'Health & Fitness',
  'pension-calculator': 'Finance',
  'design-painting': 'Arts & Entertainment',
  'ai-mosaic-studio': 'AI & Technology',
  'Motionix': 'Animation & Design',
  'Calculator-Library-Portal': 'Software & Services',
  'ultra-static-seo-engine': 'E-Business & E-Marketing',
  'universal-image-data-explorer-forge': 'Software & Services'
};

function getProductsForRepo(repoName) {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.warn(`⚠️ Products file not found: ${PRODUCTS_FILE}`);
    return [];
  }
  const allProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  const targetNiche = REPO_NICHE_MAP[repoName] || 'E-Business & E-Marketing';
  
  // Filter products that match the niche
  let filtered = allProducts.filter(p => p.niche === targetNiche);
  
  // If no products found for that niche, fall back to all products
  if (filtered.length === 0) {
    filtered = allProducts;
  }
  
  // Shuffle and pick first COUNT
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, COUNT);
}

async function rotateMoneyPages(repoName) {
  const selected = getProductsForRepo(repoName);
  if (selected.length === 0) {
    console.warn(`⚠️ No products found for ${repoName}, skipping money-keywords.csv update.`);
    return;
  }
  let csvContent = 'keyword,affiliate_link,product_name\n';
  selected.forEach(p => {
    // Escape commas in fields
    const keyword = p.keyword.replace(/,/g, ' ');
    const link = p.affiliate_link.replace(/,/g, ' ');
    const product = p.product_name.replace(/,/g, ' ');
    csvContent += `${keyword},${link},${product}\n`;
  });
  fs.writeFileSync(CSV_FILE, csvContent);
  console.log(`🔄 Updated money-keywords.csv with ${selected.length} products for ${repoName}`);
}

// If called directly (for testing), process all repos
if (require.main === module) {
  const repos = Object.keys(REPO_NICHE_MAP);
  for (const repo of repos) {
    rotateMoneyPages(repo);
  }
} else {
  module.exports = { rotateMoneyPages };
}