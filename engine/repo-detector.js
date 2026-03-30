import fs from "fs"
import { REPO_CONFIG } from "../config/repo-config.js"

// 🆕 detect new repo
export function detectNewRepo() {
  const repoName = process.env.GITHUB_REPOSITORY || "default-repo"

  if (!fs.existsSync("./data")) fs.mkdirSync("./data")

  const path = "./data/repo-log.json"
  let log = []

  try {
    if (fs.existsSync(path)) {
      const raw = fs.readFileSync(path, "utf-8")
      if (raw.trim()) log = JSON.parse(raw)
    }
  } catch {
    log = []
  }

  if (!log.includes(repoName)) {
    log.push(repoName)
    fs.writeFileSync(path, JSON.stringify(log, null, 2))

    console.log("🆕 NEW REPO DETECTED:", repoName)
    return true
  }

  console.log("♻️ Existing Repo:", repoName)
  return false
}

// 🌐 repo → domain mapping
export function detectRepoContext() {
  const fullRepo = process.env.GITHUB_REPOSITORY || ""
  const repoName = fullRepo.split("/")[1] || "default"

  const domain = REPO_CONFIG[repoName]

  if (!domain) {
    console.log("⚠️ Repo not mapped:", repoName)
    return null
  }

  return {
    repo: repoName,
    domain
  }
}