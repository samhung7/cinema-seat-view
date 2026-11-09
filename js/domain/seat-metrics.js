import { screenPoint, screenCenterY } from './screen-geometry.js';

const DEG = 180 / Math.PI;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ramp = (v, a0, a1) => clamp01((v - a0) / (a1 - a0));

/** 純幾何：從座位的眼睛位置看銀幕 */
export function measureSeat(hall, seat) {
  const S = hall.screen;
  const ex = seat.x, ey = seat.elev + seat.eye, ez = seat.z;
  const cy = screenCenterY(S);
  const horizontal = Math.hypot(ex, ez);
  const left = screenPoint(S, -0.5), right = screenPoint(S, 0.5);
  const a = Math.atan2(left.x - ex, ez - left.z);
  const b = Math.atan2(right.x - ex, ez - right.z);
  return {
    dist: Math.hypot(ex, ey - cy, ez),
    fov: Math.abs(b - a) * DEG,
    off: ex,
    offAng: Math.atan2(Math.abs(ex), ez) * DEG,
    elevAng: Math.atan2(cy - ey, horizontal) * DEG,
  };
}

/** 推薦度：水平視角 40–58° 最舒服、越靠中越好、不要抬頭太多 */
export function scoreSeat({ fov, offAng, elevAng }) {
  const sFov = fov < 40 ? ramp(fov, 22, 40) : fov > 58 ? 1 - ramp(fov, 58, 92) : 1;
  const sOff = 1 - ramp(offAng, 4, 32);
  const sElev = 1 - ramp(elevAng, 8, 30);
  return Math.round(100 * (0.5 * sFov + 0.3 * sOff + 0.2 * sElev));
}

const VIEW_TAGS = [
  { min: 70, tag: '近距離 · 包覆感' },
  { min: 52, tag: '沉浸視野' },
  { min: 36, tag: '標準視野' },
  { min: -Infinity, tag: '遠距 · 全景' },
];
const WARNINGS = [
  { when: (m) => m.elevAng > 18, text: '需要明顯抬頭，長片脖子容易痠' },
  { when: (m) => m.fov > 75,     text: '銀幕超出視線範圍，需要轉頭看字幕' },
  { when: (m) => m.offAng > 18,  text: '位置偏側，畫面會有梯形變形' },
  { when: (m) => m.fov < 32,     text: '離銀幕較遠，臨場感較弱' },
];

export function describeSeat(metrics, score) {
  const tag = VIEW_TAGS.find((t) => metrics.fov >= t.min).tag;
  const notes = WARNINGS.filter((w) => w.when(metrics)).map((w) => w.text);
  if (!notes.length) notes.push(score >= 85 ? '視角、位置和抬頭角度都在舒適範圍內，是這廳的黃金區。' : '整體舒適，沒有明顯缺點。');
  return { tag, note: notes.join('；') };
}

/** 給 hall-model 用的預設評估器：量測 + 評分 + 文字描述 */
export function evaluateSeat(hall, seat) {
  const metrics = measureSeat(hall, seat);
  const score = scoreSeat(metrics);
  return { ...metrics, score, ...describeSeat(metrics, score) };
}
