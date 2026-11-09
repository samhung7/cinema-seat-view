import { getSeatType } from '../config/seat-types.js';
import { scoreColor } from './score-color.js';

/** 大圖與右上角小圖的尺寸設定 */
const LAYOUTS = {
  full: { scale: 36, rowGap: 30, pad: 14, labelW: 22, screenH: 86, screenY: 22, maxSeat: 26, seatRatio: 0.86, radius: 4 },
  mini: { scale: 6, rowGap: 4.2, pad: 4, labelW: 0, screenH: 10, screenY: 5, maxSeat: 4, seatRatio: 0.8, radius: 1 },
};

function screenArc(L, cx, width, mini) {
  const lift = mini ? 3 : 10, bow = mini ? 2 : 8;
  let out = `<path d="M${cx - width / 2},${L.screenY + lift} Q${cx},${L.screenY - bow} ${cx + width / 2},${L.screenY + lift}" fill="none" stroke="${mini ? '#bbb' : '#e8e6e1'}" stroke-width="${mini ? 1.2 : 2.5}" stroke-linecap="round"/>`;
  if (!mini) {
    const y = L.screenY;
    out += `<defs><radialGradient id="glow" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
    out += `<path d="M${cx - width / 2},${y + 10} Q${cx},${y - 8} ${cx + width / 2},${y + 10} L${cx + width / 2 - 20},${y + 60} L${cx - width / 2 + 20},${y + 60}Z" fill="url(#glow)"/>`;
    out += `<text x="${cx}" y="${y + 36}" text-anchor="middle" font-size="10" letter-spacing="4" fill="#77767d">銀 幕</text>`;
  }
  return out;
}

function seatFill(seat, { mini, heatmap, selected }) {
  if (selected) return 'var(--sel)';
  const type = getSeatType(seat.type);
  if (mini) return type.miniFill;
  if (heatmap) return scoreColor(seat.stats.score);
  return type.mapFill;
}

function seatMarkup(seat, cx, y, L, opts) {
  const type = getSeatType(seat.type);
  const sx = cx + seat.x * L.scale;
  const size = Math.min(seat.w * L.scale * L.seatRatio, L.maxSeat);
  const height = opts.mini ? size : size * type.mapAspect;
  const selected = opts.selectedId === seat.id;
  const fill = seatFill(seat, { ...opts, selected });
  let out = `<rect class="seat" data-id="${seat.id}" x="${sx - size / 2}" y="${y - height / 2}" width="${size}" height="${height}" rx="${L.radius}" fill="${fill}"${selected && !opts.mini ? ' stroke="#fff" stroke-width="2"' : ''}/>`;
  if (!opts.mini) {
    const text = type.glyph ?? seat.num;
    const onLight = selected || opts.heatmap;
    const color = onLight ? '#111' : (type.glyphColor ?? '#b9b8bf');
    const fontSize = type.glyph ? size * 0.62 : size * (seat.num > 9 ? 0.5 : 0.58);
    out += `<text x="${sx}" y="${y + size * 0.2}" text-anchor="middle" font-size="${fontSize}" fill="${color}" pointer-events="none">${text}</text>`;
  }
  return out;
}

/**
 * 把影廳模型畫成 SVG 座位圖。
 * @param {SVGSVGElement} svg
 * @param {{hall:object, model:object}} data
 * @param {{mini?:boolean, heatmap?:boolean, selectedId?:number|null}} opts
 */
export function renderSeatMap(svg, { hall, model }, { mini = false, heatmap = false, selectedId = null } = {}) {
  const L = mini ? LAYOUTS.mini : LAYOUTS.full;
  const width = (model.roomWidth - 2.4) * L.scale + L.labelW * 2 + L.pad * 2;
  const cx = width / 2;
  const screenW = Math.min(hall.screen.width * L.scale, width - L.pad * 2 - L.labelW * 2 + (mini ? 0 : 30));
  let out = screenArc(L, cx, screenW, mini);

  let y = L.screenH;
  model.rows.forEach((row, i) => {
    if (i > 0) y += L.rowGap * (mini ? 1 : Math.max(1, (row.z - model.rows[i - 1].z) * 0.95));
    if (!mini) {
      out += `<text x="${L.pad + L.labelW / 2}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#6f6e75">${row.label}</text>`;
      out += `<text x="${width - L.pad - L.labelW / 2}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#6f6e75">${row.label}</text>`;
    }
    row.seats.forEach((seat) => { out += seatMarkup(seat, cx, y, L, { mini, heatmap, selectedId }); });
  });

  const height = y + (mini ? 6 : 24);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  if (!mini) {
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.width = `min(${width}px,100%)`;
  }
  svg.innerHTML = out;
}

/** 從點擊事件找出座位 id */
export function seatIdFromEvent(event) {
  const el = event.target.closest('.seat');
  return el ? Number(el.dataset.id) : null;
}
