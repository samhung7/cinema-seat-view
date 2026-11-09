import * as THREE from 'three';

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const LIMITS = { yaw: 1.3, pitch: 0.7, totalPitch: 1.3 };

/**
 * 相機控制：位置與注視點的補間動畫，加上使用者拖曳的轉頭量（yaw / pitch）。
 */
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.position = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.animation = null;
    this.drag = null;
  }

  get isAnimating() { return !!this.animation; }

  setPose({ position, target }) {
    this.position.copy(position);
    this.target.copy(target);
    this.yaw = 0; this.pitch = 0; this.animation = null;
  }

  /** 飛到新位置，同時把轉頭量歸零 */
  flyTo({ position, target }, seconds) {
    this.animation = {
      start: performance.now(), duration: seconds * 1000,
      fromPos: this.position.clone(), fromTarget: this.target.clone(),
      toPos: position.clone(), toTarget: target.clone(),
      fromYaw: this.yaw, fromPitch: this.pitch,
    };
  }

  beginDrag(x, y) { this.drag = { x, y, yaw: this.yaw, pitch: this.pitch }; }
  endDrag() { this.drag = null; }

  /** @param {number} radiansPerPixel 螢幕上拖一像素對應的轉角 */
  dragTo(x, y, radiansPerPixel) {
    if (!this.drag || this.animation) return;
    this.yaw = clamp(this.drag.yaw - (x - this.drag.x) * radiansPerPixel, -LIMITS.yaw, LIMITS.yaw);
    this.pitch = clamp(this.drag.pitch + (y - this.drag.y) * radiansPerPixel, -LIMITS.pitch, LIMITS.pitch);
  }

  update(now) {
    const a = this.animation;
    if (a) {
      const t = Math.min(1, (now - a.start) / a.duration);
      const k = easeInOutCubic(t);
      this.position.lerpVectors(a.fromPos, a.toPos, k);
      this.target.lerpVectors(a.fromTarget, a.toTarget, k);
      this.yaw = a.fromYaw * (1 - k);
      this.pitch = a.fromPitch * (1 - k);
      if (t >= 1) this.animation = null;
    }
    const dir = this.target.clone().sub(this.position).normalize();
    const yaw = Math.atan2(dir.x, -dir.z) + this.yaw;
    const pitch = clamp(Math.asin(dir.y) + this.pitch, -LIMITS.totalPitch, LIMITS.totalPitch);
    const look = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.position.clone().add(look));
  }
}
