import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
 * 各座位類型的 3D 造型。單位寬 1（之後依座位寬縮放 x），座位面向 -z（銀幕）。
 * 新增座位類型時在 BODY_BUILDERS / ARM_BUILDERS 登錄即可。
 */

function box(w, h, d, x, y, z, rotX = 0) {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.35);
  if (rotX) g.rotateX(rotX);
  g.translate(x, y, z);
  return g;
}

function arms(height, depth, zOffset) {
  return mergeGeometries([-0.5, 0.5].map((sx) => {
    const g = new RoundedBoxGeometry(0.1, height, depth, 2, 0.04);
    g.translate(sx, height / 2, zOffset);
    return g;
  }));
}

const BODY_BUILDERS = {
  standard: () => mergeGeometries([
    box(0.84, 0.14, 0.48, 0, 0.44, 0),
    box(0.84, 0.66, 0.12, 0, 0.82, 0.27, -0.16),
  ]),
  recliner: () => mergeGeometries([
    box(0.86, 0.24, 0.62, 0, 0.40, 0.02),        // 座墊
    box(0.86, 0.78, 0.22, 0, 0.82, 0.36, -0.22), // 椅背
    box(0.86, 0.18, 0.42, 0, 0.24, -0.42, 0.35), // 腳靠
  ]),
  '4dx': () => mergeGeometries([
    box(0.84, 0.16, 0.5, 0, 0.56, 0),            // 座椅架高在動感底座上
    box(0.84, 0.72, 0.14, 0, 0.96, 0.28, -0.12),
    box(0.95, 0.36, 0.75, 0, 0.2, 0.08),
  ]),
  wheelchair: () => {                            // 地上一塊藍色標示區
    const a = new THREE.BoxGeometry(1.3, 0.02, 0.9); a.translate(0, 0.01, 0.05);
    const b = new THREE.BoxGeometry(0.5, 0.025, 0.5); b.translate(0, 0.012, 0.05);
    return mergeGeometries([a, b]);
  },
};

const ARM_BUILDERS = {
  standard: () => arms(0.58, 0.6, 0.04),
  '4dx': () => arms(0.58, 0.6, 0.04),
  recliner: () => arms(0.62, 0.82, 0.06),
  wheelchair: null,                              // 輪椅位沒有扶手
};

export function createSeatBody(type) {
  return (BODY_BUILDERS[type] ?? BODY_BUILDERS.standard)();
}

/** @returns {THREE.BufferGeometry|null} */
export function createSeatArms(type) {
  const build = type in ARM_BUILDERS ? ARM_BUILDERS[type] : ARM_BUILDERS.standard;
  return build ? build() : null;
}
