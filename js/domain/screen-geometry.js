/**
 * 銀幕幾何。弧形銀幕的弧長等於銀幕寬，中心在 z = 0，向觀眾（+z）彎。
 * @param {{width:number, curveRadius:number}} screen
 * @param {number} u 從 -0.5（左緣）到 0.5（右緣）
 */
export function screenPoint(screen, u) {
  const s = u * screen.width;
  const r = screen.curveRadius;
  if (!r) return { x: s, z: 0 };
  const th = s / r;
  return { x: r * Math.sin(th), z: r * (1 - Math.cos(th)) };
}

export function screenCenterY(screen) {
  return screen.bottom + screen.height / 2;
}
