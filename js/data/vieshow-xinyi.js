/**
 * 台北信義威秀影城各廳座位圖（依官網座位圖轉錄）。
 * 只有排列是實際資料；3D 尺寸由 estimateHall 推估。
 */
import { estimateHall } from '../domain/hall-estimator.js';

const repeat = (labels, layout) => [...labels].map((l) => `${l}: ${layout}`);

export const VIESHOW_XINYI_LAYOUTS = [
  { no: 1,  rows: [...repeat('ABCDEFGH', '1-4 . 5-16 . 17-20'), 'I: 1 2 W . . 5-14 W . . . W 19 20'] },
  { no: 2,  type: '4dx', tag: '4DX', rows: [...repeat('ABCDEFGH', '1-4 . 5-8 . 9-12 . 13-16'), 'I: . W . W . 5-8 . 9-12 . 13-16'] },
  { no: 3,  rows: [...repeat('ABCDEFGH', '1-4 . . 5-12 . 13-18'), 'I: 1-4 . . 5-12 . W . W . W', 'J: 1-4 . 5-13'] },
  { no: 5,  rows: [...repeat('ABCDEFGHIJKL', '1-4 . 5-14 . 15-18'), 'M: 1 2 W . . W . 7-13 . . W . 17 18'] },
  { no: 6,  rows: [...repeat('ABCDEFGHIJKL', '1 2 . 3-10 . 11 12'), 'M: 1 W . . . W 6-9 . . W 12'] },
  { no: 7,  rows: [...repeat('ABCDEFGHIJKL', '1 2 . 3-10 . 11 12'), 'M: 1 W . . . W 6-9 . . W 12'] },
  { no: 9,  rows: [...repeat('ABCDEFGHIJKL', '1-4 . 5-14 . 15-18'), 'M: 1 2 W . . . W 7-14 . . W 17 18'] },
  { no: 10, rows: [...repeat('ABCDEFGHIJKL', '1-4 . 5-16 . 17-20'), 'M: 1 2 W . . . W 7-16 . . W 19 20'] },
  { no: 12, rows: [...repeat('ABCDE', '1 2 . 3-14 . 15 16'), 'F: W . . 3-12 W . . . W', ...repeat('GHIJKLMNO', '1 2 . 3-14 . 15 16'), 'P: 1 2 3 4 . . . . . . . . 11-16'] },
  { no: 14, rows: ['A: . . . . . W . . . . . . W', ...repeat('BCDEFGH', '1-4 . 5-12 . 13-16')] },
  { no: 15, rows: ['A: . . . . . W . . . . . . W', ...repeat('BCDEFGH', '1-4 . 5-12 . 13-16'), 'I: . . . . . . . . . . . . 11-16'] },
  { no: 16, rows: ['A: . . . . . W . . . . . . W', ...repeat('BCDEFGH', '1-4 . 5-12 . 13-16')] },
];

/** @returns {{id:string, label:string, hall:object}[]} */
export function vieshowXinyiPresets() {
  return VIESHOW_XINYI_LAYOUTS.map((d) => ({
    id: `vieshow-xinyi-${d.no}`,
    label: d.tag ? `${d.no}廳 ${d.tag}` : `${d.no}廳`,
    hall: estimateHall({ name: `台北信義威秀 第${d.no}廳`, tag: d.tag, type: d.type, rows: d.rows }),
  }));
}
