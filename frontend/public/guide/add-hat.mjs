/**
 * walking.json — 밀짚모자만 추가 (정확한 좌표 계산 및 기울기 조정)
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, 'walking.json');
const data = JSON.parse(readFileSync(filePath, 'utf8'));
const comp = data.assets.find(a => a.id === 'comp_0');

/*
 * 좌표 재계산:
 * 머리(head) 레이어의 원점은 [0,0]
 * 내부 Shape Group의 위치(p)가 [48.8, 62.6]
 * 머리 상단 좌표는 이 Group 내부에서 [-16, -35]
 * 따라서 Layer 좌표계에서 머리 상단은 [48.8 - 16, 62.6 - 35] = [32.8, 27.6]
 */

const hatLayer = {
  ddd: 0, ind: 21, ty: 4, nm: "straw hat",
  parent: 10, sr: 1, // parent: head
  ks: {
    o: { a: 0, k: 100, ix: 11 },
    // 왼쪽으로 더 기울이기 (기존 -15도 -> -35도)
    r: { a: 0, k: -35, ix: 10 },
    // 계산된 Layer 좌표계의 머리 상단
    p: { a: 0, k: [33, 28, 0], ix: 2, l: 2 },
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
          ks: {
            a: 0,
            k: {
              i: [[0, 0], [-15, 0], [0, 0]],
              o: [[0, -15], [15, 0], [0, 0]],
              v: [[-25, 0], [0, -25], [25, 0]],
              c: true
            }, ix: 2
          },
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

writeFileSync(filePath, JSON.stringify(data));
console.log('✅ 모자 위치(하향 및 우측 이동) 및 왼쪽 기울기(-35도) 적용 완료!');
