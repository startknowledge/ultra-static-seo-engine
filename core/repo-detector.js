import fetch from "node-fetch"

export async function detectRepos() {
  const res = await fetch("https://api.github.com/orgs/startknowledge/repos", {
    headers: {
      Authorization: `token ${process.env.DETECT_REPO_TOKEN}`
    }
  })

  const data = await res.json()

  return data.map(r => r.full_name)
}