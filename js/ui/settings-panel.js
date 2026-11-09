import { byId, show } from './dom.js';

/** 影廳 JSON 編輯與銀幕畫面設定 */
export class SettingsPanel {
  /**
   * @param {{onApply:(text:string)=>void, onReset:()=>object, onScreenFile:(f:File)=>void, onDefaultScreen:()=>void}} handlers
   *   onApply 解析失敗時丟出 Error，訊息會顯示在面板上。
   */
  constructor({ onApply, onReset, onScreenFile, onDefaultScreen }) {
    this.root = byId('settings');
    this.box = byId('jsonBox');
    this.error = byId('jsonErr');
    byId('btnClose').addEventListener('click', () => this.close());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); });
    byId('btnApply').addEventListener('click', () => {
      try { onApply(this.box.value); this.close(); }
      catch (err) { this.error.textContent = `格式錯誤：${err.message}`; }
    });
    byId('btnReset').addEventListener('click', () => this.fill(onReset()));
    byId('fileScreen').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) { onScreenFile(file); this.close(); }
    });
    byId('btnDefaultScreen').addEventListener('click', onDefaultScreen);
  }

  fill(hall) { this.box.value = JSON.stringify(hall, null, 2); this.error.textContent = ''; }
  open(hall) { this.fill(hall); show(this.root, true); }
  close() { show(this.root, false); }
}
