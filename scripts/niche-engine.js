export function detectNiche(repoName = "") {

  repoName = repoName.toLowerCase()

  // 🔥 clean repo name
  const cleaned = repoName
    .replace(/[-_]/g, " ")
    .replace(/engine|tool|repo|project|app|script|code|system|bot|api|service|platform|software|solution|module|package|lib|test|demo|example|sample|temp|dev|prod|build|version|v1|v2|v3|latest|new|old|my|your|free|best/g, "")
    .trim()

  // 🔥 smart detection
if (cleaned.includes("ai")) return "artificial intelligence"
if (cleaned.includes("artificial intelligence")) return "artificial intelligence"
if (cleaned.includes("machine learning")) return "artificial intelligence"
if (cleaned.includes("deep learning")) return "artificial intelligence"

if (cleaned.includes("crypto")) return "crypto"
if (cleaned.includes("bitcoin")) return "crypto"
if (cleaned.includes("blockchain")) return "crypto"
if (cleaned.includes("ethereum")) return "crypto"

if (cleaned.includes("health")) return "health"
if (cleaned.includes("fitness")) return "health"
if (cleaned.includes("diet")) return "health"
if (cleaned.includes("nutrition")) return "health"

if (cleaned.includes("tech")) return "technology"
if (cleaned.includes("technology")) return "technology"
if (cleaned.includes("software")) return "technology"
if (cleaned.includes("app")) return "technology"
if (cleaned.includes("tools")) return "technology"

if (cleaned.includes("blog")) return "blogging"
if (cleaned.includes("content")) return "blogging"
if (cleaned.includes("writing")) return "blogging"

if (cleaned.includes("marketing")) return "marketing"
if (cleaned.includes("digital marketing")) return "marketing"
if (cleaned.includes("affiliate")) return "affiliate marketing"
if (cleaned.includes("ads")) return "marketing"

if (cleaned.includes("finance")) return "finance"
if (cleaned.includes("money")) return "finance"
if (cleaned.includes("investment")) return "finance"
if (cleaned.includes("trading")) return "finance"

if (cleaned.includes("education")) return "education"
if (cleaned.includes("course")) return "education"
if (cleaned.includes("learn")) return "education"

if (cleaned.includes("seo")) return "seo"
if (cleaned.includes("search engine")) return "seo"
if (cleaned.includes("ranking")) return "seo"

if (cleaned.includes("business")) return "business"
if (cleaned.includes("startup")) return "business"
if (cleaned.includes("entrepreneur")) return "business"

  return cleaned || "general"
}