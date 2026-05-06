/**
 * walking.json — 남방(빨간 계열) 입히기 및 단추 추가
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, 'walking.json');
const data = JSON.parse(readFileSync(filePath, 'utf8'));
const comp = data.assets.find(a => a.id === 'comp_0');

const skinColorRgb = [0.908167820351, 0.688684979607, 0.516118128159];
const isSkinColor = (c) => Math.abs(c[0] - skinColorRgb[0]) < 0.05 && Math.abs(c[1] - skinColorRgb[1]) < 0.05;

// 남방 색상 (붉은색/갈색 계열 체크무늬 느낌의 베이스 컬러)
const shirtColor = [0.72, 0.28, 0.28, 1];

// 1. Body & Chest 색상 변경
[12, 18].forEach(ind => {
  const layer = comp.layers.find(l => l.ind === ind);
  if (!layer) return;
  layer.shapes.forEach(sg => {
    if (sg.it) {
      sg.it.forEach(item => {
        if (item.ty === 'fl' && isSkinColor(item.c.k)) {
          item.c.k = shirtColor;
        }
      });
    }
  });
});

// 2. Chest에 단추 3개 추가 (ind: 18)
const chestLayer = comp.layers.find(l => l.ind === 18);
if (chestLayer) {
  const buttonGroup = {
    ty: "gr",
    nm: "Buttons",
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

// 3. 팔(Sleeves) 만들기 (Trim Paths 활용)
[11, 19].forEach(ind => {
  const armIdx = comp.layers.findIndex(l => l.ind === ind);
  if (armIdx === -1) return;
  const originalArm = comp.layers[armIdx];
  
  // 소매 레이어 복제
  const sleeveLayer = JSON.parse(JSON.stringify(originalArm));
  sleeveLayer.ind = Math.max(...comp.layers.map(l => l.ind)) + 1; // 새로운 ID 할당
  sleeveLayer.nm = originalArm.nm + " Sleeve";
  
  // Stroke 색상을 남방 색상으로 변경
  sleeveLayer.shapes.forEach(sg => {
    if (sg.it) {
      sg.it.forEach(item => {
        if (item.ty === 'st') {
          item.c.k = shirtColor;
        }
      });
      // Trim Paths 추가 (소매 길이: 0% ~ 65%)
      sg.it.splice(sg.it.length - 1, 0, {
        ty: "tm",
        s: { a: 0, k: 0, ix: 1 },
        e: { a: 0, k: 65, ix: 2 },
        o: { a: 0, k: 0, ix: 3 },
        m: 1, ix: sg.it.length, nm: "Trim Paths", hd: false
      });
    }
  });
  
  // 소매 레이어를 원본 팔 레이어 바로 위에 추가 (소매가 피부 위를 덮도록)
  comp.layers.splice(armIdx, 0, sleeveLayer);
});

writeFileSync(filePath, JSON.stringify(data));
console.log('✅ 남방(붉은색) 착용 및 단추 추가 완료! (긴팔 셔츠 소매 구현)');
