import fs from "fs"

export function detectNewRepo() {
  const repoName = process.env.GITHUB_REPOSITORY || "default-repo"

  if (!fs.existsSync("./data")) fs.mkdirSync("./data")

  const path = "./data/repo-log.json"

  let log = []

  if (fs.existsSync(path)) {
    log = JSON.parse(fs.readFileSync(path))
  }

  if (!log.includes(repoName)) {
    log.push(repoName)
    fs.writeFileSync(path, JSON.stringify(log, null, 2))

    console.log("🆕 NEW REPO DETECTED:", repoName)
    return true
  }

  console.log("♻️ Existing Repo")
  return false
}