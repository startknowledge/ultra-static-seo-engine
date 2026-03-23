export function analyzeSearchConsole(data = []) {
  return data.map(item => {
    const ctr =
      item.impressions > 0
        ? (item.clicks / item.impressions) * 100
        : 0

    return {
      keyword: item.query,
      clicks: item.clicks,
      impressions: item.impressions,
      ctr: ctr.toFixed(2),
      action:
        ctr < 2
          ? "OPTIMIZE_CTR"
          : item.position > 10
          ? "BOOST_RANK"
          : "GOOD"
    }
  })
}