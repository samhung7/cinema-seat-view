/**
 * 座位圖的排格式解析與欄位幾何。
 * 一排寫成「A: 1-4 . 5-16 . 17-20」，冒號後每個格子對應座位圖上的一欄：
 * 數字 = 座號、a-b = 連續座號、W = 輪椅位、. = 空格（走道或沒有座位）。
 */

const CELL_PARSERS = [
  { test: (t) => t === '.',            parse: () => [null] },
  { test: (t) => /^w$/i.test(t),        parse: () => [{ wheelchair: true }] },
  { test: (t) => /^\d+-\d+$/.test(t),   parse: (t) => {
      const [a, b] = t.split('-').map(Number);
      return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => ({ num: a + i }));
    } },
  { test: (t) => /^\d+$/.test(t),       parse: (t) => [{ num: Number(t) }] },
];

export function parseRow(text) {
  const colon = text.indexOf(':');
  if (colon < 0) throw new Error(`「${text}」少了冒號，格式是「A: 1-4 . 5-16」`);
  const label = text.slice(0, colon).trim();
  const cells = text.slice(colon + 1).trim().split(/\s+/).filter(Boolean).flatMap((token) => {
    const parser = CELL_PARSERS.find((p) => p.test(token));
    if (!parser) throw new Error(`看不懂「${token}」（${label} 排）`);
    return parser.parse(token);
  });
  return { label, cells };
}

/** 找出連續的走道欄（大部分排都空著的欄） */
function aisleRuns(isAisle) {
  const runs = [];
  for (let i = 0; i < isAisle.length;) {
    if (!isAisle[i]) { i++; continue; }
    let j = i;
    while (j < isAisle.length && isAisle[j]) j++;
    runs.push([i, j]);
    i = j;
  }
  return runs;
}

/**
 * 把各排解析後，算出每一欄的 x 座標（公尺，以影廳中線為 0）。
 * 單欄走道寬 aisleWidth；多欄走道平均分配，但每欄至少一個座位寬。
 */
export function computeGrid(rowTexts, { seatWidth, aisleWidth, aisleThreshold = 0.35 }) {
  const rows = rowTexts.map(parseRow);
  const columnCount = Math.max(...rows.map((r) => r.cells.length));
  const filled = Array(columnCount).fill(0);
  rows.forEach((r) => r.cells.forEach((c, i) => { if (c) filled[i]++; }));
  const isAisle = filled.map((f) => f <= rows.length * aisleThreshold);

  const widths = Array(columnCount).fill(seatWidth);
  const runs = aisleRuns(isAisle);
  runs.forEach(([a, b]) => {
    const n = b - a;
    for (let k = a; k < b; k++) widths[k] = n === 1 ? aisleWidth : Math.max(seatWidth, aisleWidth / n);
  });

  const totalWidth = widths.reduce((s, w) => s + w, 0);
  const columnX = [];
  let x = -totalWidth / 2;
  widths.forEach((w) => { columnX.push(x + w / 2); x += w; });
  const aisleX = runs.map(([a, b]) => (columnX[a] - widths[a] / 2 + columnX[b - 1] + widths[b - 1] / 2) / 2);

  return { rows, columnCount, columnX, totalWidth, aisleX };
}

export function countCells(rows) {
  const cells = rows.flatMap((r) => r.cells.filter(Boolean));
  return {
    seats: cells.filter((c) => !c.wheelchair).length,
    wheelchairs: cells.filter((c) => c.wheelchair).length,
  };
}
