import { computeGrid, countCells } from './row-layout.js';

const round1 = (v) => Math.round(v * 10) / 10;

/** 依座位類型推估的尺寸（公尺）。要支援新的廳型只要加一筆。 */
const PROFILES = {
  standard: { screenRatio: 0.85, screenBottom: 1.2, pitch: 1.0,  rise: 0.3,  eyeHeight: 1.15 },
  '4dx':    { screenRatio: 0.8,  screenBottom: 1.5, pitch: 1.15, rise: 0.35, eyeHeight: 1.25 },
};

/**
 * 只有座位圖、沒有實測尺寸時，依座位區寬度推估 3D 尺寸。
 * 產出的 JSON 標記 estimated: true。
 */
export function estimateHall({ name, tag = '數位', type = 'standard', rows }) {
  const p = PROFILES[type] ?? PROFILES.standard;
  const seatWidth = 0.55, aisleWidth = 1.0;
  const grid = computeGrid(rows, { seatWidth, aisleWidth });
  const { seats, wheelchairs } = countCells(grid.rows);
  const screenWidth = Math.min(15, Math.max(7, round1(grid.totalWidth * p.screenRatio)));
  return {
    name,
    subtitle: `${tag}廳 · ${seats} 席${wheelchairs ? ` · 輪椅位 ${wheelchairs}` : ''}`,
    estimated: true,
    seatType: type,
    screen: { width: screenWidth, height: round1(screenWidth / 2.1), bottom: p.screenBottom, curveRadius: 0 },
    firstRowDistance: round1(Math.max(4, screenWidth * 0.5)),
    seatWidth,
    aisleWidth,
    pitch: p.pitch,
    rise: p.rise,
    flatRows: 2,
    eyeHeight: p.eyeHeight,
    rows,
  };
}
