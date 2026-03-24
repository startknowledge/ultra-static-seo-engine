export function predictTraffic({
  searchVolume,
  position
}) {
  const ctrCurve = {
    1: 0.28,
    2: 0.15,
    3: 0.10,
    4: 0.07,
    5: 0.05,
    6: 0.04,
    7: 0.03,
    8: 0.02,
    9: 0.015,
    10: 0.01
  };

  const ctr = ctrCurve[position] || 0.005;

  const traffic = Math.floor(searchVolume * ctr);

  return {
    position,
    estimatedTraffic: traffic
  };
}