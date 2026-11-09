import { byId } from './dom.js';
import { renderSeatMap, seatIdFromEvent } from './seat-map-renderer.js';
import { seatName, seatTypeLabel } from '../domain/seat-format.js';
import { scoreColor } from './score-color.js';

const CENTRE_TOLERANCE = 0.15; // 公尺內算正中

/** 3D 畫面下方的座位資訊面板 */
export class SeatSheet {
  constructor({ onPrev, onNext, onChangeSeat, onPickSeat, onResize }) {
    this.root = byId('sheet');
    this.mini = byId('miniMap');
    byId('btnPrev').addEventListener('click', onPrev);
    byId('btnNext').addEventListener('click', onNext);
    byId('btnChange').addEventListener('click', onChangeSeat);
    byId('grab').addEventListener('click', () => { this.root.classList.toggle('collapsed'); onResize(); });
    this.mini.addEventListener('click', (e) => {
      const id = seatIdFromEvent(e);
      if (id !== null) onPickSeat(id);
    });
  }

  get height() { return this.root.offsetHeight || 0; }

  render({ hall, model, selected: seat }) {
    const st = seat.stats;
    const off = Math.abs(st.off);
    const centred = off < CENTRE_TOLERANCE;
    const text = {
      sTag: st.tag,
      sTitle: seatName(seat),
      sSub: `${seatTypeLabel(seat.type)} · ${hall.name.replace('台北', '')}`,
      vDist: `${st.dist.toFixed(1)} m`,
      vFov: `${Math.round(st.fov)}°`,
      vOff: centred ? '正中' : `${off.toFixed(1)} m`,
      vOffL: centred ? '偏離中心' : (st.off < 0 ? '偏左' : '偏右'),
      vEl: `${Math.max(0, Math.round(st.elevAng))}°`,
      vScore: st.score,
      vNote: st.note,
    };
    Object.entries(text).forEach(([id, value]) => { byId(id).textContent = value; });
    const fill = byId('vFill');
    fill.style.width = `${st.score}%`;
    fill.style.background = scoreColor(st.score);
    renderSeatMap(this.mini, { hall, model }, { mini: true, selectedId: seat.id });
  }
}
