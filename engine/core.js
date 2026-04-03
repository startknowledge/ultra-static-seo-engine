import { getCombinedTrends } from './trend-engine.js';
import { generateMoneyPagesForRepo } from './money-engine.js';
import { generateLocationPages } from './programmatic-engine.js';
import { buildTopicClusters, crossLinkRepos } from './authority-engine.js';
import { autoBacklink } from './backlink-engine.js';
import { refreshOldBlogs } from './content-rewriter.js';

// Inside the loop for each repo:
const trends = await getCombinedTrends();
console.log("Trends for content ideas:", trends.slice(0,5));

// Generate money pages
const moneyPages = await generateMoneyPagesForRepo(repo, domain, strategy.cluster);
console.log(`💰 Generated ${moneyPages.length} money pages`);

// Generate programmatic pages (example locations)
const locations = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
const progPages = await generateLocationPages(repo, domain, strategy.niche, locations);
console.log(`📍 Generated ${progPages.length} programmatic pages`);

// Build authority signals
await buildTopicClusters(repo, blogs);
await crossLinkRepos(repos);

// Auto backlink (first blog only)
if (blogs.length) await autoBacklink(blogs[0].keyword, "Some content", blogs[0].url);

// Refresh old blogs
await refreshOldBlogs(repo, 60);