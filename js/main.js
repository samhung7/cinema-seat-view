/**
 * 進入點：建立具體實作並注入 App。
 * 要換資料來源（例如別家影城）或換 3D 引擎，只需要改這裡。
 */
import { App } from './app.js';
import { vieshowXinyiPresets } from './data/vieshow-xinyi.js';
import { SafeStorage, CustomHallRepository } from './infra/storage.js';
import { CinemaViewer } from './three/cinema-viewer.js';
import { buildHallScene } from './three/hall-scene-builder.js';
import { createDesertTexture, createTextureFromFile } from './three/screen-textures.js';

let desert = null;
const defaultScreenTexture = () => (desert ??= createDesertTexture());

const app = new App({
  presets: vieshowXinyiPresets(),
  customHalls: new CustomHallRepository(new SafeStorage()),
  createViewer: (canvas, getOccludedBottom) => new CinemaViewer(canvas, {
    sceneFactory: buildHallScene,
    screenTexture: defaultScreenTexture(),
    getOccludedBottom,
  }),
  createScreenTexture: createTextureFromFile,
  getDefaultScreenTexture: defaultScreenTexture,
});
app.start();

// 方便除錯與自動化測試
window.__app = {
  get model() { return app.store.get().model; },
  get state() { return app.store.get(); },
};
