import { createStore } from './core/store.js';
import { buildHallModel, neighborSeat } from './domain/hall-model.js';
import { validateHall } from './domain/hall-validator.js';
import { evaluateSeat } from './domain/seat-metrics.js';
import { HallPicker } from './ui/hall-picker.js';
import { MapScreen } from './ui/map-screen.js';
import { SeatSheet } from './ui/seat-sheet.js';
import { SeatViewHud } from './ui/seat-view-hud.js';
import { SettingsPanel } from './ui/settings-panel.js';
import { byId } from './ui/dom.js';

const CUSTOM_KEY = 'custom';

/**
 * 組裝層：把狀態、領域邏輯、UI 元件和 3D 檢視器接起來。
 * 依賴都從建構子注入，元件之間不直接互相引用。
 */
export class App {
  /**
   * @param {{presets:{id:string,label:string,hall:object}[], customHalls:{load,save,clear},
   *          createViewer:(canvas:HTMLCanvasElement, getOccludedBottom:()=>number)=>object,
   *          createScreenTexture:(file:File)=>object, getDefaultScreenTexture:()=>object}} deps
   */
  constructor({ presets, customHalls, createViewer, createScreenTexture, getDefaultScreenTexture }) {
    this.presets = presets;
    this.customHalls = customHalls;
    this.createViewer = createViewer;
    this.createScreenTexture = createScreenTexture;
    this.getDefaultScreenTexture = getDefaultScreenTexture;
    this.viewer = null;

    this.store = createStore({ hallKey: presets[0].id, hall: null, model: null, selected: null, heatmap: false, view: 'map', wide: false });

    this.picker = new HallPicker(byId('hallSeg'), (key) => this.selectHall(key));
    this.mapScreen = new MapScreen({
      onSelectSeat: (id) => this.selectSeat(id),
      onToggleHeatmap: () => this.store.set({ heatmap: !this.store.get().heatmap }),
      onEnterSeatView: () => this.enterSeatView(),
      onOpenSettings: () => this.settings.open(this.store.get().hall),
    });
    this.hud = new SeatViewHud({
      onBack: () => this.exitSeatView(),
      onToggleWide: () => this.store.set({ wide: !this.store.get().wide }),
    });
    this.sheet = new SeatSheet({
      onPrev: () => this.stepSeat(-1),
      onNext: () => this.stepSeat(1),
      onChangeSeat: () => this.exitSeatView(),
      onPickSeat: (id) => this.moveToSeat(this.store.get().model.seats[id], 1.0),
      onResize: () => this.viewer?.updateProjection(),
    });
    this.settings = new SettingsPanel({
      onApply: (text) => this.applyCustomHall(text),
      onReset: () => this.resetCustomHall(),
      onScreenFile: (file) => this.ensureViewer().setScreenTexture(this.createScreenTexture(file)),
      onDefaultScreen: () => this.ensureViewer().setScreenTexture(this.getDefaultScreenTexture()),
    });

    this.store.subscribe((s) => this.render(s));
  }

  start() { this.selectHall(this.presets[0].id); }

  /* ---------- 狀態轉換 ---------- */

  hallOptions() {
    const options = this.presets.map((p) => ({ key: p.id, label: p.label }));
    if (this.customHalls.load()) options.push({ key: CUSTOM_KEY, label: '自訂' });
    return options;
  }

  selectHall(key) {
    const hall = key === CUSTOM_KEY ? this.customHalls.load() : this.presets.find((p) => p.id === key)?.hall;
    if (!hall) return;
    this.loadHall(structuredClone(hall), key);
  }

  loadHall(hall, hallKey) {
    const model = buildHallModel(hall, { evaluate: evaluateSeat });
    this.viewer?.setHall(hall, model);
    this.store.set({ hall, model, hallKey, selected: null });
  }

  selectSeat(id) { this.store.set({ selected: this.store.get().model.seats[id] }); }

  stepSeat(direction) {
    const { model, selected } = this.store.get();
    const next = neighborSeat(model, selected, direction);
    if (next) this.moveToSeat(next, 0.7);
  }

  moveToSeat(seat, seconds) {
    this.store.set({ selected: seat });
    this.viewer.focusSeat(seat, seconds);
  }

  applyCustomHall(text) {
    const hall = validateHall(JSON.parse(text));
    this.customHalls.save(hall);
    this.loadHall(hall, CUSTOM_KEY);
  }

  /** 清掉自訂影廳，回到目前（或第一個）預設廳，回傳它給設定面板顯示 */
  resetCustomHall() {
    this.customHalls.clear();
    const { hallKey } = this.store.get();
    const preset = this.presets.find((p) => p.id === hallKey) ?? this.presets[0];
    this.selectHall(preset.id);
    return preset.hall;
  }

  ensureViewer() {
    if (!this.viewer) {
      this.viewer = this.createViewer(byId('stage'), () => this.sheet.height);
      this.viewer.onUserLook = () => this.hud.hideHint();
      const { hall, model } = this.store.get();
      this.viewer.setHall(hall, model);
      this.hud.setLoaded();
    }
    return this.viewer;
  }

  enterSeatView() {
    const { selected } = this.store.get();
    if (!selected) return;
    this.store.set({ view: 'seat' });
    this.ensureViewer().start(selected);
    this.hud.flashHint();
  }

  exitSeatView() {
    this.viewer?.stop();
    this.store.set({ view: 'map' });
  }

  /* ---------- 繪製 ---------- */

  render(state) {
    const inSeatView = state.view === 'seat';
    this.mapScreen.setVisible(!inSeatView);
    this.hud.setVisible(inSeatView);
    this.picker.render(this.hallOptions(), state.hallKey);
    if (inSeatView && state.selected) {
      this.hud.setSeat(state.selected);
      this.hud.setWide(state.wide);
      this.sheet.render(state);
      this.viewer?.setWide(state.wide);
      this.viewer?.highlight(state.selected.id);
    } else {
      this.mapScreen.render(state);
    }
  }
}
