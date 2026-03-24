export function analyzeCompetition(keyword) {
  const difficulty = Math.floor(Math.random() * 100);

  return {
    keyword,
    difficulty
  };
}