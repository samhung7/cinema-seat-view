import * as THREE from 'three';
import { screenCenterY } from '../domain/screen-geometry.js';

/** 座位上的眼睛位置 */
export function seatEye(seat) {
  return new THREE.Vector3(seat.x, seat.elev + seat.eye, seat.z + (seat.wheelchair ? 0.2 : 0.05));
}

export function screenCenter(hall) {
  return new THREE.Vector3(0, screenCenterY(hall.screen), 0);
}

/** 從影廳後上方俯瞰的起始視角 */
export function overviewPose(model) {
  const firstZ = model.rows[0].z;
  return {
    position: new THREE.Vector3(0, model.ceiling - 0.6, model.backZ - 0.8),
    target: new THREE.Vector3(0, model.topElev * 0.4, firstZ + (model.backZ - firstZ) * 0.35),
  };
}
