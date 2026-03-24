export function decide({
  difficulty,
  estimatedTraffic,
  position
}) {
  if (difficulty > 70 && position > 30) {
    return "SKIP";
  }

  if (estimatedTraffic > 500) {
    return "PUBLISH";
  }

  if (position < 20) {
    return "OPTIMIZE";
  }

  return "LOW_PRIORITY";
}