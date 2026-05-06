/**
 * walking.json — 밀짚모자 + 셔츠 완벽 적용본 (찌찌 완벽 삭제)
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inPath = join(__dirname, 'walking.json.bak');
const outPath = join(__dirname, 'walking.json');
const data = JSON.parse(readFileSync(inPath, 'utf8'));
const comp = data.assets.find(a => a.id === 'comp_0');

// ━━━━━━━━━━━━━━━━━━━━━━━
// 1. 밀짚모자 (머리 위에 정확히 안착)
// ━━━━━━━━━━━━━━━━━━━━━━━
const hatLayer = {
  ddd: 0, ind: 21, ty: 4, nm: "straw hat",
  parent: 10, sr: 1, // parent: head
  ks: {
    o: { a: 0, k: 100, ix: 11 },
    r: { a: 0, k: -35, ix: 10 },
    p: { a: 0, k: [30, 8, 0], ix: 2, l: 2 },
    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 }
  },
  ao: 0,
  shapes: [
    {
      ty: "gr",
      it: [
        { d: 1, ty: "el", s: { a: 0, k: [115, 20], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, nm: "Brim", hd: false },
        { ty: "fl", c: { a: 0, k: [0.88, 0.76, 0.50, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "st", c: { a: 0, k: [0.74, 0.62, 0.38, 1], ix: 3 }, o: { a: 0, k: 100, ix: 4 }, w: { a: 0, k: 2, ix: 5 }, lc: 2, lj: 1, ml: 10, bm: 0, nm: "Stroke", hd: false },
        { ty: "tr", p: { a: 0, k: [0, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: "Transform" }
      ],
      nm: "Brim", np: 3, cix: 2, bm: 0, ix: 1, mn: "ADBE Vector Group", hd: false
    },
    {
      ty: "gr",
      it: [
        { ty: "rc", d: 1, s: { a: 0, k: [50, 6], ix: 2 }, p: { a: 0, k: [0, -3], ix: 3 }, r: { a: 0, k: 2, ix: 4 }, nm: "Band", hd: false },
        { ty: "fl", c: { a: 0, k: [0.45, 0.30, 0.18, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "tr", p: { a: 0, k: [0, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: "Transform" }
      ],
      nm: "Band", np: 2, cix: 2, bm: 0, ix: 2, mn: "ADBE Vector Group", hd: false
    },
    {
      ty: "gr",
      it: [
        {
          ind: 0, ty: "sh", ix: 1,
          ks: { a: 0, k: { i: [[0, 0], [-15, 0], [0, 0]], o: [[0, -15], [15, 0], [0, 0]], v: [[-25, 0], [0, -25], [25, 0]], c: true }, ix: 2 },
          nm: "Crown", hd: false
        },
        { ty: "fl", c: { a: 0, k: [0.84, 0.72, 0.44, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "st", c: { a: 0, k: [0.74, 0.62, 0.38, 1], ix: 3 }, o: { a: 0, k: 100, ix: 4 }, w: { a: 0, k: 2, ix: 5 }, lc: 2, lj: 1, ml: 10, bm: 0, nm: "Stroke", hd: false },
        { ty: "tr", p: { a: 0, k: [0, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: "Transform" }
      ],
      nm: "Crown", np: 3, cix: 2, bm: 0, ix: 3, mn: "ADBE Vector Group", hd: false
    }
  ],
  ip: 0, op: 600, st: 0, ct: 1, bm: 0
};
const earIdx = comp.layers.findIndex(l => l.ind === 3);
comp.layers.splice(earIdx, 0, hatLayer);

// ━━━━━━━━━━━━━━━━━━━━━━━
// 2. 남방 입히기 및 찌찌 완벽 삭제!
// ━━━━━━━━━━━━━━━━━━━━━━━
const skinColorRgb = [0.908167820351, 0.688684979607, 0.516118128159];
const isSkinColor = (c) => Math.abs(c[0] - skinColorRgb[0]) < 0.05 && Math.abs(c[1] - skinColorRgb[1]) < 0.05;
const shirtColor = [0.72, 0.28, 0.28, 1]; // 남방 색상

// 진짜 찌찌 레이어(ind: 1, ind: 2) 숨기기! (Chest에 parent된 레이어들)
[1, 2].forEach(ind => {
  const nippleLayer = comp.layers.find(l => l.ind === ind);
  if (nippleLayer) nippleLayer.hd = true;
});

// 상체 색상 변경 & 배꼽 숨기기
const bodyLayer = comp.layers.find(l => l.ind === 12);
if (bodyLayer) {
  if (bodyLayer.shapes[4]) bodyLayer.shapes[4].hd = true; // 배꼽/기타 디테일
  bodyLayer.shapes.forEach(sg => {
    if (sg.it) {
      sg.it.forEach(item => {
        if (item.ty === 'fl' && isSkinColor(item.c.k)) {
          item.c.k = shirtColor;
        }
      });
    }
  });
}

// 가슴 색상 변경 및 단추 추가
const chestLayer = comp.layers.find(l => l.ind === 18);
if (chestLayer) {
  chestLayer.shapes.forEach(sg => {
    if (sg.it) {
      sg.it.forEach(item => {
        if (item.ty === 'fl' && isSkinColor(item.c.k)) {
          item.c.k = shirtColor;
        }
      });
    }
  });
  
  const buttonGroup = {
    ty: "gr", nm: "Buttons",
    it: [
      { ty: "fl", c: { a: 0, k: [0.95, 0.95, 0.95, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
      { ty: "el", d: 1, s: { a: 0, k: [6, 6], ix: 2 }, p: { a: 0, k: [-18, -25], ix: 3 }, nm: "Btn1", hd: false },
      { ty: "el", d: 1, s: { a: 0, k: [6, 6], ix: 2 }, p: { a: 0, k: [-20, -5], ix: 3 }, nm: "Btn2", hd: false },
      { ty: "el", d: 1, s: { a: 0, k: [6, 6], ix: 2 }, p: { a: 0, k: [-22, 15], ix: 3 }, nm: "Btn3", hd: false },
      { ty: "tr", p: { a: 0, k: [0, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: "Transform" }
    ],
    np: 4, cix: 2, bm: 0, ix: chestLayer.shapes.length + 1, mn: "ADBE Vector Group", hd: false
  };
  chestLayer.shapes.push(buttonGroup);
}

// ━━━━━━━━━━━━━━━━━━━━━━━
// 3. 소매(Sleeves) 만들기
// ━━━━━━━━━━━━━━━━━━━━━━━
[11, 19].forEach(ind => {
  const armIdx = comp.layers.findIndex(l => l.ind === ind);
  if (armIdx === -1) return;
  const originalArm = comp.layers[armIdx];
  const sleeveLayer = JSON.parse(JSON.stringify(originalArm));
  sleeveLayer.ind = Math.max(...comp.layers.map(l => l.ind)) + 1;
  sleeveLayer.nm = originalArm.nm + " Sleeve";
  
  sleeveLayer.shapes.forEach(sg => {
    if (sg.it) {
      sg.it.forEach(item => {
        if (item.ty === 'st') {
          item.c.k = shirtColor;
        }
      });
      sg.it.splice(sg.it.length - 1, 0, {
        ty: "tm", s: { a: 0, k: 0, ix: 1 }, e: { a: 0, k: 65, ix: 2 }, o: { a: 0, k: 0, ix: 3 }, m: 1, ix: sg.it.length, nm: "Trim Paths", hd: false
      });
    }
  });
  comp.layers.splice(armIdx, 0, sleeveLayer);
});

writeFileSync(outPath, JSON.stringify(data));
console.log('✅ 모자 위치 상향 + 찌찌 레이어(ind:1, 2) 완전 삭제 + 셔츠 적용!');
