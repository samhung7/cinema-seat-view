import * as THREE from 'three';
import { screenPoint, screenCenterY } from '../domain/screen-geometry.js';
import { SEAT_TYPES, getSeatType } from '../config/seat-types.js';
import { createSeatBody, createSeatArms } from './seat-geometry.js';

const SELECTED_COLOR = new THREE.Color(0x3fcf8a);
const FRONT_WALL_Z = -3.1;

const mat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness });

function addRoom(group, hall, model) {
  const W = model.roomWidth, ceil = model.ceiling, depth = model.backZ + 3.5, wallH = ceil + 1;
  const wallMat = mat(0x1a1416, 0.95);
  const mesh = (geo, material, x, y, z) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); group.add(m); return m; };

  mesh(new THREE.BoxGeometry(W, 0.1, model.backZ + 4), mat(0x17110f), 0, -0.05, (model.backZ + 4) / 2 - 3);
  [-1, 1].forEach((side) => {
    mesh(new THREE.BoxGeometry(0.2, wallH, depth), wallMat, side * (W / 2 + 0.1), wallH / 2 - 0.5, depth / 2 - 3);
    addWallSconces(group, model, side);
  });
  mesh(new THREE.BoxGeometry(W + 0.4, wallH, 0.2), wallMat, 0, wallH / 2 - 0.5, model.backZ + 0.1);
  mesh(new THREE.BoxGeometry(W + 0.4, wallH, 0.2), mat(0x050505), 0, wallH / 2 - 0.5, FRONT_WALL_Z);
  mesh(new THREE.BoxGeometry(W + 0.4, 0.2, depth), mat(0x0c0a0b), 0, ceil + 0.1, depth / 2 - 3);
  mesh(new THREE.BoxGeometry(W, 0.5, 2.6), mat(0x0f0b0b), 0, 0.25, -1.6);                 // 前方舞台
  mesh(new THREE.PlaneGeometry(W, wallH), new THREE.MeshBasicMaterial({ color: 0x020202 }), 0, wallH / 2 - 0.5, -0.2); // 銀幕黑框
}

function addWallSconces(group, model, side) {
  const firstZ = model.rows[0].z, span = model.backZ - firstZ;
  const material = new THREE.MeshBasicMaterial({ color: 0x8a5a3a });
  for (let z = 2; z < model.backZ; z += 4) {
    const rise = z > firstZ ? model.topElev * (z - firstZ) / span : 0;
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.12), material);
    l.position.set(side * (model.roomWidth / 2 - 0.01), Math.min(model.ceiling - 1.5, 3.2 + rise), z);
    group.add(l);
  }
}

function addTiers(group, model) {
  const stepMat = mat(0x221917, 0.9);
  model.rows.forEach((r, i) => {
    const prev = i > 0 ? model.rows[i - 1].elev : 0;
    if (r.elev <= prev) return;
    const zStart = r.z - r.pitch / 2, depth = model.backZ - zStart;
    const b = new THREE.Mesh(new THREE.BoxGeometry(model.roomWidth, r.elev - prev, depth), stepMat);
    b.position.set(0, prev + (r.elev - prev) / 2, zStart + depth / 2);
    group.add(b);
  });
}

function addAisleLights(group, hall, model) {
  const geo = new THREE.BoxGeometry(hall.aisleWidth * 0.8, 0.02, 0.025);
  const material = new THREE.MeshBasicMaterial({ color: 0xfff1d6 });
  model.rows.forEach((r) => {
    [...model.aisleX, -r.width / 2 - 0.6, r.width / 2 + 0.6].forEach((x) => {
      const s = new THREE.Mesh(geo, material);
      s.position.set(x, r.elev + 0.012, r.z - r.pitch / 2 + 0.02);
      group.add(s);
    });
  });
}

function createScreen(screen, texture) {
  const geo = new THREE.PlaneGeometry(screen.width, screen.height, 96, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const p = screenPoint(screen, pos.getX(i) / screen.width);
    pos.setXYZ(i, p.x, pos.getY(i), p.z);
  }
  geo.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, color: 0xd8d8d8 });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(0, screenCenterY(screen), 0);
  return { mesh, material };
}

function addLights(group, screen, model) {
  group.add(new THREE.HemisphereLight(0x8a7464, 0x140c0a, 1.1));
  const fromScreen = new THREE.DirectionalLight(0xffe2c2, 2.6);
  fromScreen.position.set(0, screen.bottom + screen.height * 0.6, -0.5);
  fromScreen.target.position.set(0, 0, model.backZ * 0.7);
  group.add(fromScreen, fromScreen.target);
  const fill = new THREE.PointLight(0xffd7b0, 120, 40, 1.4);
  fill.position.set(0, screenCenterY(screen), 2.5);
  group.add(fill);
}

/** 每種座位類型一組 InstancedMesh */
function addSeats(group, model) {
  const batches = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  Object.keys(SEAT_TYPES).forEach((type) => {
    const seats = model.seats.filter((seat) => seat.type === type);
    if (!seats.length) return;
    const body = new THREE.InstancedMesh(createSeatBody(type), mat(0xffffff, 0.7), seats.length);
    const armGeo = createSeatArms(type);
    const arms = armGeo ? new THREE.InstancedMesh(armGeo, mat(0x1b1717, 0.6), seats.length) : null;
    seats.forEach((seat, i) => {
      const yaw = Math.atan2(seat.x, seat.z + 18) * 0.6; // 微微轉向銀幕，做出弧形排列感
      m4.compose(p.set(seat.x, seat.elev, seat.z), q.setFromEuler(e.set(0, yaw, 0)), s.set(seat.w, 1, 1));
      body.setMatrixAt(i, m4);
      arms?.setMatrixAt(i, m4);
    });
    group.add(body);
    if (arms) group.add(arms);
    batches.push({ mesh: body, seats, base: new THREE.Color(getSeatType(type).color3d) });
  });
  return batches;
}

/**
 * 依影廳 JSON 和座位模型程式化生成整個影廳。
 * @returns {{group:THREE.Group, setScreenTexture:(t)=>void, highlight:(id:number|null)=>void, dispose:()=>void}}
 */
export function buildHallScene(hall, model, screenTexture) {
  const group = new THREE.Group();
  addRoom(group, hall, model);
  addTiers(group, model);
  addAisleLights(group, hall, model);
  const screen = createScreen(hall.screen, screenTexture);
  group.add(screen.mesh);
  addLights(group, hall.screen, model);
  const seatBatches = addSeats(group, model);

  return {
    group,
    setScreenTexture(texture) { screen.material.map = texture; screen.material.needsUpdate = true; },
    highlight(selectedId) {
      seatBatches.forEach(({ mesh, seats, base }) => {
        seats.forEach((seat, i) => mesh.setColorAt(i, seat.id === selectedId ? SELECTED_COLOR : base));
        mesh.instanceColor.needsUpdate = true;
      });
    },
    dispose() {
      group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    },
  };
}
