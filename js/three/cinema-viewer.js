import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CameraRig } from './camera-rig.js';
import { seatEye, screenCenter, overviewPose } from './viewpoints.js';

const FOV = {
  normal: { horizontal: 72, min: 36, max: 80 },   // 接近人眼中央視野
  wide:   { horizontal: 100, min: 50, max: 105 }, // 看完整銀幕
};
const OVERVIEW_PAUSE_MS = 450;
const FLY_IN_SECONDS = 2.6;

/**
 * 3D 影廳檢視器。只負責 three.js 的渲染、相機與動畫；
 * 場景內容由 sceneFactory 產生（預設是 buildHallScene），方便替換。
 */
export class CinemaViewer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{sceneFactory:Function, screenTexture:THREE.Texture, getOccludedBottom:()=>number}} deps
   */
  constructor(canvas, { sceneFactory, screenTexture, getOccludedBottom }) {
    this.canvas = canvas;
    this.sceneFactory = sceneFactory;
    this.screenTexture = screenTexture;
    this.getOccludedBottom = getOccludedBottom;
    this.wide = false;
    this.running = false;
    this.hallScene = null;
    this.pending = null;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050506);
    this.scene.fog = new THREE.Fog(0x050506, 30, 70);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 200);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.8, 0.82));
    this.composer.addPass(new OutputPass());
    this.rig = new CameraRig(this.camera);

    this.bindPointer();
    addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
  }

  bindPointer() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      this.rig.beginDrag(e.clientX, e.clientY);
      c.setPointerCapture(e.pointerId);
      this.onUserLook?.();
    });
    c.addEventListener('pointermove', (e) => this.rig.dragTo(e.clientX, e.clientY, (this.camera.fov * Math.PI / 180) / innerHeight));
    c.addEventListener('pointerup', () => this.rig.endDrag());
    c.addEventListener('pointercancel', () => this.rig.endDrag());
  }

  /** 換影廳時呼叫；真正建場景延到下次顯示，避免在 2D 畫面做白工 */
  setHall(hall, model) { this.pending = { hall, model }; }

  ensureScene() {
    if (!this.pending) return;
    const { hall, model } = this.pending;
    if (this.hallScene) { this.scene.remove(this.hallScene.group); this.hallScene.dispose(); }
    this.hallScene = this.sceneFactory(hall, model, this.screenTexture);
    this.scene.add(this.hallScene.group);
    this.current = this.pending;
    this.pending = null;
  }

  setScreenTexture(texture) {
    this.screenTexture = texture;
    this.hallScene?.setScreenTexture(texture);
  }

  highlight(seatId) { this.hallScene?.highlight(seatId); }

  setWide(wide) { this.wide = wide; this.updateProjection(); }

  /** 從俯瞰視角停一下，再飛進座位 */
  start(seat) {
    this.ensureScene();
    this.resize();
    this.highlight(seat.id);
    this.rig.setPose(overviewPose(this.current.model));
    clearTimeout(this.flyTimer);
    this.flyTimer = setTimeout(() => this.focusSeat(seat, FLY_IN_SECONDS), OVERVIEW_PAUSE_MS);
    this.running = true;
    requestAnimationFrame(this.loop);
  }

  stop() { this.running = false; clearTimeout(this.flyTimer); }

  focusSeat(seat, seconds) {
    this.highlight(seat.id);
    this.rig.flyTo({ position: seatEye(seat), target: screenCenter(this.current.hall) }, seconds);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.updateProjection();
  }

  /** 把投影中心移到下方面板以上的可見區，視角以可見區計算 */
  updateProjection() {
    const w = innerWidth, h = innerHeight;
    const visible = Math.max(h * 0.35, h - this.getOccludedBottom() + 24);
    const hidden = h - visible;
    this.camera.setViewOffset(w, h + hidden, 0, hidden, w, h);
    const f = this.wide ? FOV.wide : FOV.normal;
    let v = 2 * Math.atan(Math.tan(f.horizontal * Math.PI / 360) / (w / visible)) * 180 / Math.PI;
    v = Math.max(f.min, Math.min(f.max, v));
    const t = Math.tan(v * Math.PI / 360) * (h + hidden) / visible;
    this.camera.fov = 2 * Math.atan(t) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
  }

  loop(now) {
    if (!this.running) return;
    this.rig.update(now);
    this.composer.render();
    requestAnimationFrame(this.loop);
  }
}
