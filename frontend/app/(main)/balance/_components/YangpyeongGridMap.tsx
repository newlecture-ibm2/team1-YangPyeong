import React from 'react';
import styles from './YangpyeongGridMap.module.css';

interface TownNode {
  name: string;
  row: number;
  col: number;
}

const TOWNS: TownNode[] = [
  { name: '서종면', row: 1, col: 1 },
  { name: '청운면', row: 1, col: 3 },
  { name: '단월면', row: 1, col: 4 },
  { name: '양서면', row: 2, col: 1 },
  { name: '옥천면', row: 2, col: 2 },
  { name: '양동면', row: 2, col: 4 },
  { name: '양평읍', row: 3, col: 2 },
  { name: '용문면', row: 3, col: 3 },
  { name: '지평면', row: 3, col: 4 },
  { name: '강하면', row: 4, col: 1 },
  { name: '강상면', row: 4, col: 2 },
  { name: '개군면', row: 4, col: 3 },
];

export interface YangpyeongGridMapProps {
  selectedTownName: string | null;
  onTownSelect: (townName: string) => void;
  // 각 읍면동의 전체적인 수급 상황을 표시하기 위한 맵 데이터 (옵션)
  townStatusMap?: Record<string, string>; 
}

export default function YangpyeongGridMap({
  selectedTownName,
  onTownSelect,
  townStatusMap = {}
}: YangpyeongGridMapProps) {
  // 4x4 Grid를 그리기 위한 배열 생성
  const gridCells = [];
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 4; c++) {
      const town = TOWNS.find(t => t.row === r && t.col === c);
      if (town) {
        // '전체 보기'와 같이 null 이면 선택된 타일이 없는 상태로 처리
        const isActive = selectedTownName === town.name;
        let statusClass = '';
        
        const status = townStatusMap[town.name];
        if (status && !isActive) { // 선택되지 않은 경우에만 배경색상 반영
          if (status.includes('BALANCED')) statusClass = styles.status_balanced;
          else if (status.includes('SHORT')) statusClass = styles.status_short;
          else if (status.includes('EXCESS')) statusClass = styles.status_excess;
        }

        gridCells.push(
          <div
            key={town.name}
            className={`${styles.mapTile} ${isActive ? styles.activeTile : ''} ${statusClass}`}
            onClick={() => onTownSelect(town.name)}
            style={{ gridRow: r, gridColumn: c }}
          >
            <span>{town.name}</span>
            {isActive && <span className={styles.tileBadge}>조회 중</span>}
          </div>
        );
      } else {
        // 빈 셀
        gridCells.push(
          <div
            key={`empty-${r}-${c}`}
            className={styles.emptyTile}
            style={{ gridRow: r, gridColumn: c }}
          ></div>
        );
      }
    }
  }

  return (
    <div className={styles.mapContainer}>
      <p className={styles.mapGuide}>🗺️ 지도를 클릭하여 해당 지역의 수급 현황을 확인하세요</p>
      {gridCells}
    </div>
  );
}
