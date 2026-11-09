import { computeGrid } from './row-layout.js';
import { DEFAULT_SEAT_TYPE } from '../config/seat-types.js';

const WHEELCHAIR_EYE_HEIGHT = 1.2;

/**
 * 把影廳 JSON 轉成每個座位的 3D 位置。
 * evaluate 由外部注入，讓模型不綁死某一種評分方式。
 */
export function buildHallModel(hall, { evaluate }) {
  const grid = computeGrid(hall.rows, hall);
  const flatRows = hall.flatRows ?? 2;
  const rows = grid.rows.map((parsed, rowIndex) => {
    const z = hall.firstRowDistance + rowIndex * hall.pitch;
    const elev = Math.max(0, rowIndex - flatRows + 1) * hall.rise;
    let wheelchairNo = 0;
    const seats = [];
    parsed.cells.forEach((cell, col) => {
      if (!cell) return;
      const wheelchair = !!cell.wheelchair;
      seats.push({
        row: parsed.label,
        rowIndex,
        num: wheelchair ? null : cell.num,
        wheelchair,
        wheelchairNo: wheelchair ? ++wheelchairNo : 0,
        col,
        x: grid.columnX[col],
        z,
        elev,
        w: hall.seatWidth,
        type: wheelchair ? 'wheelchair' : (hall.seatType || DEFAULT_SEAT_TYPE),
        eye: wheelchair ? WHEELCHAIR_EYE_HEIGHT : hall.eyeHeight,
      });
    });
    return { label: parsed.label, z, elev, pitch: hall.pitch, width: grid.totalWidth, seats };
  });

  const seats = rows.flatMap((r) => r.seats);
  seats.forEach((s, id) => { s.id = id; s.stats = evaluate(hall, s); });

  const S = hall.screen;
  const last = rows[rows.length - 1];
  return {
    rows,
    seats,
    aisleX: grid.aisleX,
    roomWidth: Math.max(grid.totalWidth + 2.4, S.width + 2),
    backZ: last.z + last.pitch / 2 + 1.2,
    topElev: last.elev,
    ceiling: Math.max(S.bottom + S.height + 1.8, last.elev + hall.eyeHeight + 3.2),
  };
}

/** 同一排的左右鄰座 */
export function neighborSeat(model, seat, direction) {
  const row = model.rows[seat.rowIndex].seats;
  return row[row.indexOf(seat) + direction] ?? null;
}
