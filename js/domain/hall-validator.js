import { parseRow } from './row-layout.js';

const positive = (v) => typeof v === 'number' && v > 0;

/** 檢查使用者編輯的影廳 JSON，回傳補齊預設值的新物件（不改動輸入） */
export function validateHall(input) {
  const h = structuredClone(input);
  if (!h.screen || !positive(h.screen.width) || !positive(h.screen.height)) throw new Error('screen.width / height 必須是正數');
  if (!Array.isArray(h.rows) || !h.rows.length) throw new Error('rows 至少要有一排，例如 ["A: 1-4 . 5-16 . 17-20"]');
  h.rows.forEach(parseRow);
  ['seatWidth', 'pitch'].forEach((k) => { if (!positive(h[k])) throw new Error(`${k} 必須是正數`); });
  h.rise = Number(h.rise) || 0;
  h.flatRows = Number.isInteger(h.flatRows) ? h.flatRows : 2;
  h.firstRowDistance = positive(h.firstRowDistance) ? h.firstRowDistance : 5;
  h.aisleWidth = h.aisleWidth >= 0 ? h.aisleWidth : 1.0;
  h.eyeHeight = positive(h.eyeHeight) ? h.eyeHeight : 1.15;
  h.screen.bottom = h.screen.bottom >= 0 ? h.screen.bottom : 1.2;
  h.screen.curveRadius = positive(h.screen.curveRadius) ? h.screen.curveRadius : 0;
  return h;
}
