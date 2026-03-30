import fs from "fs"
import { REPO_CONFIG } from "../config/repo-config.js"

const LOG_PATH = "./data/repo-log.json"

// 🔥 detect new repo
export function detectNewRepo() {
  const repoName = process.env.GITHUB_REPOSITORY || "default-repo"

  if (!fs.existsSync("./data")) fs.mkdirSync("./data")

  let log = []

  if (fs.existsSync(LOG_PATH)) {
    try {
      log = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"))
    } catch {
      log = []
    }
  }

  if (!log.includes(repoName)) {
    log.push(repoName)
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))

    console.log("🆕 NEW REPO DETECTED:", repoName)
    return true
  }

  console.log("♻️ Existing Repo")
  return false
}

// 🔥 FINAL CONTEXT DETECTOR (repo-config based)
export function detectRepoContext() {
  const full = process.env.GITHUB_REPOSITORY || "default-repo"
  const repoName = full.split("/")[1] || full

  const domain = REPO_CONFIG[repoName]

  if (!domain) {
    console.log("⚠️ Repo not mapped → skipping")
    return null
  }

  // 🔥 repo words
  const words = repoName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)

  // 🔥 niche (no hardcode)
  const niche = words.join(" ")

  return {
    repo: repoName,
    domain,
    words,
    niche
  }
}