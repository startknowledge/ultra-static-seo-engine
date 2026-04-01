import { CONFIG } from '../config.js';
import { readJson, writeJson } from './utils.js';

const STATE_FILE = './data/repos.json';

async function fetchReposFromGitHub() {
  const url = `https://api.github.com/orgs/${CONFIG.GITHUB_ORG}/repos?per_page=100`;
  const token = process.env.ALL_REPO || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('No GitHub token provided.');
  
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const repos = await res.json();
  return repos.map(r => r.name);
}

export async function getRepos(forceRefresh = false) {
  let repos = readJson(STATE_FILE, []);
  if (forceRefresh || repos.length === 0) {
    console.log('🔄 Fetching repos from GitHub...');
    repos = await fetchReposFromGitHub();
    writeJson(STATE_FILE, repos);
  }
  return repos;
}

export async function detectNewRepos() {
  const old = readJson(STATE_FILE, []);
  const fresh = await fetchReposFromGitHub();
  const newRepos = fresh.filter(r => !old.includes(r));
  if (newRepos.length) {
    console.log(`🆕 New repos detected: ${newRepos.join(', ')}`);
    writeJson(STATE_FILE, fresh);
  }
  return { all: fresh, new: newRepos };
}