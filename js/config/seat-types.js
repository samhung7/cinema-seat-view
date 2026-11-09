/**
 * 座位類型登錄表。
 * 新增一種座位（例如情人座）只要在這裡登錄，
 * 再到 three/seat-geometry.js 登錄它的 3D 造型，其他程式不用改。
 */
export const SEAT_TYPES = Object.freeze({
  standard:   { label: '一般座位',              mapFill: 'var(--seat)',     miniFill: '#4a4a52', color3d: 0x9b1c1f, mapAspect: 1 },
  recliner:   { label: '豪華躺椅',              mapFill: 'var(--recliner)', miniFill: '#6b2b31', color3d: 0x6e1824, mapAspect: 0.78 },
  '4dx':      { label: '4DX 動感座椅',          mapFill: 'var(--seat)',     miniFill: '#4a4a52', color3d: 0x3a3d47, mapAspect: 1 },
  wheelchair: { label: '輪椅位（需至影城購買）', mapFill: 'var(--wc)',       miniFill: '#2f55c9', color3d: 0x2f55c9, mapAspect: 1, glyph: '♿', glyphColor: '#fff' },
});

export const DEFAULT_SEAT_TYPE = 'standard';

export function getSeatType(id) {
  return SEAT_TYPES[id] ?? SEAT_TYPES[DEFAULT_SEAT_TYPE];
}
