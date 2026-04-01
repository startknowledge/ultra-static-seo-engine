import { CONFIG } from '../config.js';
import { readJson, writeJson } from './utils.js';

const STATE_FILE = './data/repos.json';

// Fetch all repos from GitHub organisation
async function fetchReposFromGitHub() {
  const url = `https://api.github.com/orgs/${CONFIG.GITHUB_ORG}/repos?per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.ALL_REPO}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const repos = await res.json();
  return repos.map(r => r.name);
}

// Main function: get all repos (from cache or fresh)
export async function getRepos(forceRefresh = false) {
  let repos = readJson(STATE_FILE, []);

  if (forceRefresh || repos.length === 0) {
    console.log('🔄 Fetching repos from GitHub...');
    repos = await fetchReposFromGitHub();
    writeJson(STATE_FILE, repos);
  }

  return repos;
}

// Detect new repos since last run
export async function detectNewRepos() {
  const old = readJson(STATE_FILE, []);
  const fresh = await fetchReposFromGitHub();
  const newRepos = fresh.filter(r => !old.includes(r));

  if (newRepos.length) {
    console.log(`🆕 New repos detected: ${newRepos.join(', ')}`);
    // update state immediately
    writeJson(STATE_FILE, fresh);
  }

  return { all: fresh, new: newRepos };
}
