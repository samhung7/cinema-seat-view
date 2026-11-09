import { byId, show } from './dom.js';
import { renderSeatMap, seatIdFromEvent } from './seat-map-renderer.js';
import { seatName, seatTypeLabel } from '../domain/seat-format.js';

/** 2D 選位畫面：標題、座位圖、熱區開關、下方選位列 */
export class MapScreen {
  constructor({ onSelectSeat, onToggleHeatmap, onEnterSeatView, onOpenSettings }) {
    this.el = {
      root: byId('mapView'), title: byId('hallName'), subtitle: byId('hallSub'), svg: byId('seatSvg'),
      heatSwitch: byId('heatSwitch'), legend: byId('legend'), heatLegend: byId('heatLegend'),
      pickSmall: byId('pickSmall'), pickBig: byId('pickBig'), viewBtn: byId('btnView'),
    };
    this.el.svg.addEventListener('click', (e) => {
      const id = seatIdFromEvent(e);
      if (id !== null) onSelectSeat(id);
    });
    this.el.heatSwitch.addEventListener('click', onToggleHeatmap);
    this.el.viewBtn.addEventListener('click', onEnterSeatView);
    byId('btnSettings').addEventListener('click', onOpenSettings);
  }

  setVisible(visible) { show(this.el.root, visible); }

  render({ hall, model, selected, heatmap }) {
    const e = this.el;
    e.title.textContent = hall.name || '自訂影廳';
    e.subtitle.textContent = (hall.subtitle || '') + (hall.estimated ? ' · 3D 尺寸為推估' : '');
    e.heatSwitch.classList.toggle('on', heatmap);
    show(e.legend, !heatmap);
    show(e.heatLegend, heatmap);
    renderSeatMap(e.svg, { hall, model }, { heatmap, selectedId: selected?.id ?? null });
    if (selected) {
      e.pickSmall.textContent = `${seatTypeLabel(selected.type)} · 推薦度 ${selected.stats.score}`;
      e.pickBig.textContent = seatName(selected);
    } else {
      e.pickSmall.textContent = '選擇你的座位';
      e.pickBig.textContent = '—';
    }
    e.viewBtn.disabled = !selected;
  }
}
