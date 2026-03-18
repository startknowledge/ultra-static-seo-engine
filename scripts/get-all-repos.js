export async function getAllRepos(){

  const username = "startknowledge"
  const githubToken = process.env.DETECT_REPO_TOKEN

  const res = await fetch(`https://api.github.com/users/${username}/repos`, {
    headers: {
      Authorization: `token ${githubToken}`
    }
  })

  const data = await res.json()

  // sirf useful repos lo (filter kar sakte ho)
  return data
    .filter(repo => !repo.fork)
    .map(repo => repo.full_name)
}
