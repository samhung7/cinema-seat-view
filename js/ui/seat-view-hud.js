import { byId, show } from './dom.js';
import { seatShortName } from '../domain/seat-format.js';

const HINT_MS = 5200;

/** 3D 畫面上層的 HUD：返回、標題、廣角切換、操作提示 */
export class SeatViewHud {
  constructor({ onBack, onToggleWide }) {
    this.root = byId('seatView');
    this.title = byId('hudTitle');
    this.hint = byId('hint');
    this.wideBtn = byId('btnWide');
    this.loading = byId('loading');
    byId('btnBack').addEventListener('click', onBack);
    this.wideBtn.addEventListener('click', onToggleWide);
  }

  setVisible(visible) { show(this.root, visible); }
  setLoaded() { show(this.loading, false); }
  setWide(wide) { this.wideBtn.classList.toggle('on', wide); }
  setSeat(seat) { this.title.textContent = `從 ${seatShortName(seat)} 看出去`; }

  flashHint() {
    this.hint.classList.remove('faded');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.hideHint(), HINT_MS);
  }

  hideHint() { this.hint.classList.add('faded'); }
}
