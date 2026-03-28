export function clusterKeywords(keywords) {

  let clusters = {}

  keywords.forEach(k => {

    const main = k.split(" ").slice(-1)[0] // last word

    if (!clusters[main]) clusters[main] = []

    clusters[main].push(k)
  })

  return clusters
}