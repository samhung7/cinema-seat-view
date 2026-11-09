const STOPS = [[0, [201, 86, 79]], [50, [224, 162, 79]], [72, [215, 211, 106]], [90, [95, 211, 160]]];

/** 推薦度 0–100 對應的顏色（紅 → 黃 → 綠） */
export function scoreColor(score) {
  let a = STOPS[0], b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (score >= STOPS[i][0] && score <= STOPS[i + 1][0]) { a = STOPS[i]; b = STOPS[i + 1]; break; }
  }
  const t = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (score - a[0]) / (b[0] - a[0])));
  return `rgb(${a[1].map((v, i) => Math.round(v + (b[1][i] - v) * t)).join(',')})`;
}
