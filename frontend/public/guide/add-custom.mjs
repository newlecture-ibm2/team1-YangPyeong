/**
 * walking.json — 밀짚모자 + 셔츠 완벽 적용 + 동적 손 추적 삼지창 (중간 파지 + 손 뒤로 배치)
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
// 1. 밀짚모자
// ━━━━━━━━━━━━━━━━━━━━━━━
const hatLayer = {
  ddd: 0, ind: 21, ty: 4, nm: "straw hat",
  parent: 10, sr: 1,
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
// 2. 남방 입히기 및 찌찌 삭제
// ━━━━━━━━━━━━━━━━━━━━━━━
const skinColorRgb = [0.908167820351, 0.688684979607, 0.516118128159];
const isSkinColor = (c) => Math.abs(c[0] - skinColorRgb[0]) < 0.05 && Math.abs(c[1] - skinColorRgb[1]) < 0.05;
const shirtColor = [0.72, 0.28, 0.28, 1];

[1, 2].forEach(ind => {
  const nippleLayer = comp.layers.find(l => l.ind === ind);
  if (nippleLayer) nippleLayer.hd = true;
});

const bodyLayer = comp.layers.find(l => l.ind === 12);
if (bodyLayer) {
  if (bodyLayer.shapes[4]) bodyLayer.shapes[4].hd = true; 
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
// 3. 소매 만들기
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

// ━━━━━━━━━━━━━━━━━━━━━━━
// 4. 화면 앞쪽(right hand, ind: 11) 손끝 추적 삼지창
// ━━━━━━━━━━━━━━━━━━━━━━━
const rHand = comp.layers.find(l => l.ind === 11);
const rHandSg = rHand.shapes[0];
const rHandPath = rHandSg.it.find(i => i.ty === 'sh').ks;
const rHandTr = rHandSg.it.find(i => i.ty === 'tr').p.k; 

const pKeyframes = rHandPath.k.map(kf => {
  let v = kf.s && kf.s[0] && kf.s[0].v ? kf.s[0].v[1] : [0,0]; 
  return {
    t: kf.t,
    s: [v[0] + rHandTr[0], v[1] + rHandTr[1], 0],
    i: kf.i,
    o: kf.o
  };
});

const pitchforkLayer = {
  ddd: 0, ind: 56, ty: 4, nm: "pitchfork", // 고유 인덱스 부여
  parent: 11, sr: 1, 
  ks: {
    o: { a: 0, k: 100, ix: 11 },
    r: { a: 0, k: 20, ix: 10 },
    p: { a: 1, k: pKeyframes, ix: 2, l: 2 }, 
    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 }
  },
  ao: 0,
  shapes: [
    { // 손잡이(막대) 중심점을 핸들 가운데로 이동 (p: [0,0]으로 변경)
      ty: "gr",
      it: [
        { ty: "rc", d: 1, s: { a: 0, k: [8, 250], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, r: { a: 0, k: 0, ix: 4 }, nm: "Handle", hd: false },
        { ty: "fl", c: { a: 0, k: [0.55, 0.35, 0.15, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "tr", p: { a:0, k:[0,0], ix:2}, a: {a:0, k:[0,0], ix:1}, s:{a:0,k:[100,100], ix:3}, r:{a:0,k:0, ix:6}, o:{a:0,k:100, ix:7}, sk:{a:0,k:0, ix:4}, sa:{a:0,k:0, ix:5}, nm: "Transform" }
      ],
      nm: "Stick", np: 2, cix: 2, bm: 0, ix: 1, mn: "ADBE Vector Group", hd: false
    },
    { // 쇠창 받침 (p: [0, -125] 로 상향 조정)
      ty: "gr",
      it: [
        { ty: "rc", d: 1, s: { a: 0, k: [40, 8], ix: 2 }, p: { a: 0, k: [0, -125], ix: 3 }, r: { a: 0, k: 0, ix: 4 }, nm: "Base", hd: false },
        { ty: "fl", c: { a: 0, k: [0.7, 0.7, 0.75, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "tr", p: { a:0, k:[0,0], ix:2}, a: {a:0, k:[0,0], ix:1}, s:{a:0,k:[100,100], ix:3}, r:{a:0,k:0, ix:6}, o:{a:0,k:100, ix:7}, sk:{a:0,k:0, ix:4}, sa:{a:0,k:0, ix:5}, nm: "Transform" }
      ],
      nm: "Base", np: 2, cix: 2, bm: 0, ix: 2, mn: "ADBE Vector Group", hd: false
    },
    { // 창 1 (p: [-17, -150] 로 상향 조정)
      ty: "gr",
      it: [
        { ty: "rc", d: 1, s: { a: 0, k: [6, 50], ix: 2 }, p: { a: 0, k: [-17, -150], ix: 3 }, r: { a: 0, k: 0, ix: 4 }, nm: "P1", hd: false },
        { ty: "fl", c: { a: 0, k: [0.7, 0.7, 0.75, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "tr", p: { a:0, k:[0,0], ix:2}, a: {a:0, k:[0,0], ix:1}, s:{a:0,k:[100,100], ix:3}, r:{a:0,k:0, ix:6}, o:{a:0,k:100, ix:7}, sk:{a:0,k:0, ix:4}, sa:{a:0,k:0, ix:5}, nm: "Transform" }
      ],
      nm: "P1", np: 2, cix: 2, bm: 0, ix: 3, mn: "ADBE Vector Group", hd: false
    },
    { // 창 2 (p: [0, -150] 로 상향 조정)
      ty: "gr",
      it: [
        { ty: "rc", d: 1, s: { a: 0, k: [6, 50], ix: 2 }, p: { a: 0, k: [0, -150], ix: 3 }, r: { a: 0, k: 0, ix: 4 }, nm: "P2", hd: false },
        { ty: "fl", c: { a: 0, k: [0.7, 0.7, 0.75, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "tr", p: { a:0, k:[0,0], ix:2}, a: {a:0, k:[0,0], ix:1}, s:{a:0,k:[100,100], ix:3}, r:{a:0,k:0, ix:6}, o:{a:0,k:100, ix:7}, sk:{a:0,k:0, ix:4}, sa:{a:0,k:0, ix:5}, nm: "Transform" }
      ],
      nm: "P2", np: 2, cix: 2, bm: 0, ix: 4, mn: "ADBE Vector Group", hd: false
    },
    { // 창 3 (p: [17, -150] 로 상향 조정)
      ty: "gr",
      it: [
        { ty: "rc", d: 1, s: { a: 0, k: [6, 50], ix: 2 }, p: { a: 0, k: [17, -150], ix: 3 }, r: { a: 0, k: 0, ix: 4 }, nm: "P3", hd: false },
        { ty: "fl", c: { a: 0, k: [0.7, 0.7, 0.75, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "Fill", hd: false },
        { ty: "tr", p: { a:0, k:[0,0], ix:2}, a: {a:0, k:[0,0], ix:1}, s:{a:0,k:[100,100], ix:3}, r:{a:0,k:0, ix:6}, o:{a:0,k:100, ix:7}, sk:{a:0,k:0, ix:4}, sa:{a:0,k:0, ix:5}, nm: "Transform" }
      ],
      nm: "P3", np: 2, cix: 2, bm: 0, ix: 5, mn: "ADBE Vector Group", hd: false
    }
  ],
  ip: 0, op: 600, st: 0, ct: 1, bm: 0
};

// 삼지창을 손 '뒤'에 렌더링하기 위해, 배열에서 손(11번 레이어)의 바로 '다음' 인덱스에 삽입.
// (Lottie 배열에서 인덱스가 높을수록 더 뒤에 그려짐)
const frontHandIdx = comp.layers.findIndex(l => l.ind === 11);
comp.layers.splice(frontHandIdx + 1, 0, pitchforkLayer);

writeFileSync(outPath, JSON.stringify(data));
console.log('✅ 삼지창 파지 위치(중간) 상향 조정 및 손 뒤로 렌더링 순서 변경 완벽 적용 완료!');
