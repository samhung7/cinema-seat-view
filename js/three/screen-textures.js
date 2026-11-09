import * as THREE from 'three';

/** 預設銀幕畫面：程式畫的沙漠，不需要外部圖檔 */
export function createDesertTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1080;
  const g = c.getContext('2d');

  const sky = g.createLinearGradient(0, 0, 0, c.height * 0.62);
  sky.addColorStop(0, '#cdb9a3'); sky.addColorStop(0.55, '#e6d4bd'); sky.addColorStop(1, '#efdcc4');
  g.fillStyle = sky; g.fillRect(0, 0, c.width, c.height);

  const sun = g.createRadialGradient(1300, 420, 10, 1300, 420, 520);
  sun.addColorStop(0, 'rgba(255,246,228,.9)'); sun.addColorStop(1, 'rgba(255,246,228,0)');
  g.fillStyle = sun; g.fillRect(0, 0, c.width, c.height);

  const dunes = [
    { y: 0.60, a: 22, f: [0.004, 0.0013],  col: ['#c9ab88', '#b9976f'] },
    { y: 0.66, a: 40, f: [0.003, 0.0021],  col: ['#d3ae80', '#a97f55'] },
    { y: 0.76, a: 70, f: [0.0022, 0.0009], col: ['#dcb47f', '#9d7146'] },
    { y: 0.90, a: 90, f: [0.0016, 0.0031], col: ['#e2b97f', '#8e6239'] },
  ];
  dunes.forEach((d, i) => {
    g.beginPath(); g.moveTo(0, c.height);
    for (let x = 0; x <= c.width; x += 8) {
      g.lineTo(x, c.height * d.y - d.a * Math.sin(x * d.f[0] + i * 1.7) - d.a * 0.5 * Math.sin(x * d.f[1] + i));
    }
    g.lineTo(c.width, c.height); g.closePath();
    const gr = g.createLinearGradient(0, c.height * d.y - d.a * 1.5, 0, c.height);
    gr.addColorStop(0, d.col[0]); gr.addColorStop(1, d.col[1]);
    g.fillStyle = gr; g.fill();
  });

  const haze = g.createLinearGradient(0, c.height * 0.5, 0, c.height * 0.75);
  haze.addColorStop(0, 'rgba(240,226,206,.55)'); haze.addColorStop(1, 'rgba(240,226,206,0)');
  g.fillStyle = haze; g.fillRect(0, 0, c.width, c.height);

  g.fillStyle = '#2a1d14';
  const px = 1180, py = c.height * 0.66 - 40 * Math.sin(px * 0.003 + 1.7) - 20 * Math.sin(px * 0.0021 + 1);
  g.beginPath(); g.ellipse(px, py - 26, 7, 24, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(px, py - 56, 6, 0, Math.PI * 2); g.fill();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** 使用者選的圖片或影片 → 貼圖 */
export function createTextureFromFile(file) {
  const url = URL.createObjectURL(file);
  let texture;
  if (file.type.startsWith('video')) {
    const video = Object.assign(document.createElement('video'), { src: url, loop: true, muted: true, playsInline: true });
    video.play();
    texture = new THREE.VideoTexture(video);
  } else {
    texture = new THREE.TextureLoader().load(url);
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
