/**
 * 추천 rec·캘린더 phases 기준 세부 계획서(월별·주별) 생성
 */

import type { CalendarPhase, CropRecommendation } from './recommend.types';
import type { CropDetailedPlan, MonthlyPlan, WeeklyTask } from './calendarPlanData';
import {
  buildTotalDurationLabel,
  enumerateMonthsInCultivationOrder,
  resolveSowingHarvestPeriods,
} from './cropCalendarSync';

type CropPlanKind =
  | 'rice'
  | 'barley'
  | 'pepper'
  | 'cherry_tomato'
  | 'tomato'
  | 'potato'
  | 'sweet_potato'
  | 'soybean'
  | 'cabbage'
  | 'ginseng'
  | 'generic';

type PhaseType = 'sow' | 'growth' | 'harvest';

const COLORS = { sow: '#52B788', growth: '#2D6A4F', harvest: '#CCFF33', mid: '#74C69D', plant: '#40916C' };

function norm(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

function resolveCropPlanKind(cropName: string): CropPlanKind {
  const n = norm(cropName);
  if (n.includes('쌀') || n.includes('벼')) return 'rice';
  if (n.includes('보리')) return 'barley';
  if (n.includes('방울')) return 'cherry_tomato';
  if (n.includes('토마토')) return 'tomato';
  if (n.includes('고추') || n.includes('피망')) return 'pepper';
  if (n.includes('감자')) return 'potato';
  if (n.includes('고구마')) return 'sweet_potato';
  if (n.includes('콩')) return 'soybean';
  if (n.includes('배추') || n.includes('양배추')) return 'cabbage';
  if (n.includes('인삼')) return 'ginseng';
  return 'generic';
}

function monthInPhase(month: number, phase: CalendarPhase): boolean {
  if (phase.startMonth <= phase.endMonth) {
    return month >= phase.startMonth && month <= phase.endMonth;
  }
  return month >= phase.startMonth || month <= phase.endMonth;
}

function phaseTypeForMonth(month: number, phases: CalendarPhase[]): PhaseType {
  for (const p of phases) {
    if (!monthInPhase(month, p)) continue;
    if (p.label.includes('파종') || p.label.includes('육묘')) return 'sow';
    if (p.label.includes('수확')) return 'harvest';
    return 'growth';
  }
  return 'growth';
}

function phaseColor(month: number, phases: CalendarPhase[]): string {
  for (const p of phases) {
    if (monthInPhase(month, p)) return p.color;
  }
  return COLORS.growth;
}

function phaseTitle(kind: CropPlanKind, type: PhaseType, month: number): string {
  const titles: Record<CropPlanKind, Record<PhaseType, string>> = {
    rice: { sow: '모내기·파종기', growth: '생육·관수기', harvest: '수확·건조기' },
    barley: { sow: '파종·월동기', growth: '월동·생육기', harvest: '수확·후작기' },
    pepper: { sow: '육묘·정식기', growth: '생육·병해충 관리', harvest: '수확기' },
    cherry_tomato: { sow: '파종·육묘기', growth: '생육·유인기', harvest: '수확기' },
    tomato: { sow: '파종·정식기', growth: '생육·유인기', harvest: '수확기' },
    potato: { sow: '종구·파종기', growth: '경농·생육기', harvest: '수확·저장기' },
    sweet_potato: { sow: '모종·정식기', growth: '덩굴·생육기', harvest: '수확·저장기' },
    soybean: { sow: '파종·초기생육', growth: '생육·결실기', harvest: '수확·건조기' },
    cabbage: { sow: '육묘·정식기', growth: '결구·생육기', harvest: '수확기' },
    ginseng: { sow: '정식·월동기', growth: '생육·차광기', harvest: '수확·건조기' },
    generic: { sow: '파종·정식기', growth: '생육 관리기', harvest: '수확기' },
  };
  return titles[kind][type] || `${month}월 재배`;
}

function buildWeeks(
  kind: CropPlanKind,
  type: PhaseType,
  rec: CropRecommendation,
  month: number,
  monthIdx: number,
  totalMonths: number,
): WeeklyTask[] {
  const name = rec.cropName;
  const pests = rec.pests?.length ? rec.pests.join(', ') : '병해충';
  const temp = rec.optimalTemp ? `적정 온도 ${rec.optimalTemp}. ` : '';

  const isFirst = monthIdx === 0;
  const isLast = monthIdx === totalMonths - 1;

  const byKind: Record<CropPlanKind, Record<PhaseType, () => WeeklyTask[]>> = {
    rice: {
      sow: () => [
        { week: '1~2주차', task: '모내기 준비', detail: '논 정리·밭다리 보수. 육묘 상태(본잎 3~4매) 확인 후 이앙 시기 결정.', tip: '이앙 적기는 5월 중순 전후, 기온 15°C 이상이 안정될 때가 좋습니다.' },
        { week: '3~4주차', task: '모내기·초기 관리', detail: '이앙 후 3~5cm 수심 유지. 새싹 활착까지 7~10일간 물 관리 집중.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '분얼·관수', detail: '유효 분얼 촉진을 위해 물 관리·질소 시비(지역 권장량 준수). 잡초 방제.' },
        { week: '3~4주차', task: '중기 생육·예찰', detail: `${temp}잎집무늬마름병·멸구류(${pests}) 예찰. 물 깊이 5~8cm 유지.` },
      ],
      harvest: () => [
        { week: '1~2주차', task: '성숙도 확인', detail: '이삭 80% 이상 황색, 수분 20~24% 전후가 적기. 조기 수확 시 도체 저하 주의.' },
        {
          week: '3~4주차',
          task: '수확·건조',
          detail: '건조·저장 시 습도 관리. 수확 후 논 정리 및 겨울 작물 계획 수립.',
          ...(isLast ? { tip: '수확 직후 바로 건조하지 않으면 쌀알이 누렇게 변할 수 있습니다.' } : {}),
        },
      ],
    },
    barley: {
      sow: () => [
        { week: '1~2주차', task: '파종 준비', detail: '밭갈이·밑거름(퇴비·인산) 투입. 종자 발아율 확인.' },
        { week: '3~4주차', task: '파종', detail: `${name} 파종(10월). 파종 후 압실·초기 관수.` },
      ],
      growth: () => [
        { week: '1~2주차', task: '월동 관리', detail: '겨울철 배수·보온. 봄철 2차 추비(질소) 준비.' },
        { week: '3~4주차', task: '봄 생육', detail: '생육 촉진 추비·잡초 방제. 줄무늬병·붉은곰팡이병 예찰.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '적기 수확', detail: '이삭 황색화 90% 이상 시 수확. 우천 전 조기 수확 검토.' },
        { week: '3~4주차', task: '후작 준비', detail: '짚·잔재 처리. 다음 작물(콩·옥수수 등) 파종 계획.' },
      ],
    },
    pepper: {
      sow: () => [
        { week: '1~2주차', task: '육묘·정식 준비', detail: '종자 소독·육묘(2~4월). 밭 이랑·멀칭·지주 설치.' },
        { week: '3~4주차', task: '정식·활착', detail: '정식 후 관수·곁순 제거. 1차 추비(질소 과다 주의).', tip: '활착기에는 인산 위주 액비가 효과적입니다.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '유인·적엽', detail: '지주 유인·통풍 확보. 탄저병·진딧물 예찰.' },
        { week: '3~4주차', task: '장마 대비', detail: '배수로 정비·예방 방제. 고온기 점적관수 조절.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '풋·홍 수확', detail: '품종·출하 목적에 맞춰 풋/홍 수확 시기 조절. 3~5일 간격 수확.' },
        { week: '3~4주차', task: '후기 수확·정리', detail: '서리 전 잔여 과실 수확. 고추대·잔재물 정리.' },
      ],
    },
    cherry_tomato: {
      sow: () => [
        { week: '1~2주차', task: '파종·육묘', detail: '플러그 파종(2~3월). 발아 후 온도·광량 관리.' },
        { week: '3~4주차', task: '정식 준비', detail: '밑비료·지주·유인줄 설치. 정식 직전 경화.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '유인·적심', detail: '곁순 제거·화방 정리. 칼슘 엽면시비(열과 예방).' },
        { week: '3~4주차', task: '병해·환기', detail: '곰팡이병·흰가루병 예찰. 장마·고온기 환기 강화.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '착색 수확', detail: '완숙 착색 후 아침 수확. 주 2~3회 수확 리듬 유지.' },
        { week: '3~4주차', task: '마무리', detail: isLast ? '시설 정비·다음 시즌 종자 준비.' : '품질 저하 과실 제거·추비 조절.' },
      ],
    },
    tomato: {
      sow: () => [
        { week: '1~2주차', task: '파종·육묘', detail: '육묘(3~4월) 후 정식. 토양 pH 6.0~6.8 유지.' },
        { week: '3~4주차', task: '정식·활착', detail: '정식 후 1차 추비. 곁순·유인 시작.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '생육 관리', detail: `${temp}통풍·적엽. 진딧물·곰팡이병 예찰.` },
        { week: '3~4주차', task: '착과 관리', detail: '칼슘·붕소 엽면시비. 과습 시 역병 주의.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '수확', detail: '적기 수확·등급 선별. 고온기 수확물 예냉.' },
        { week: '3~4주차', task: '정리', detail: '잔여 과실 수확·포장 정리.' },
      ],
    },
    potato: {
      sow: () => [
        { week: '1~2주차', task: '종구·파종', detail: '종구 소독·절단면 건조. 3~4월 파종, 이랑 재배.' },
        { week: '3~4주차', task: '출현·초기 관리', detail: '출현 전후 관수·1차 추비. 서리 피해 모니터링.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '경농·토양 관리', detail: '북주기·토양 산화 방지. 역병 예방(배수).' },
        { week: '3~4주차', task: '중기 생육', detail: '가루뿌리병·진딧물 예찰. 과습 금지.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '적기 수확', detail: '줄기 황화·껍질 경화 확인 후 수확.' },
        { week: '3~4주차', task: '저장·출하', detail: '해침·광색·저장고 환기 관리.' },
      ],
    },
    sweet_potato: {
      sow: () => [
        { week: '1~2주차', task: '모종·정식', detail: '4~5월 정식. 덮참·멀칭으로 잡초 억제.' },
        { week: '3~4주차', task: '활착 관리', detail: '초기 관수·1차 추비. 줄기 유인(필요 시).' },
      ],
      growth: () => [
        { week: '1~2주차', task: '덩굴 관리', detail: '불필요 덩굴 정리·토양 건조도 유지.' },
        { week: '3~4주차', task: '중기 생육', detail: '뿌리비대기 전 물·양분 관리. 검은무늬병 예찰.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '수확', detail: '첫 서리 전 수확 권장. 블루링 방지(가벼운 취급).' },
        { week: '3~4주차', task: '저장', detail: '온도 13~16°C·습도 85% 전후 저장.' },
      ],
    },
    soybean: {
      sow: () => [
        { week: '1~2주차', task: '파종', detail: '6~7월 파종. 접종균(재배 관행 시) 및 밑거름.' },
        { week: '3~4주차', task: '초기 생육', detail: '출현 확인·잡초 방제. 과습 시 뿌리 부패 주의.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '중기 관리', detail: '결실기 물 관리. 붉은병·가루깍지벌레 예찰.' },
        { week: '3~4주차', task: '결실 점검', detail: '등숙기 전 물 부족 방지.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '수확', detail: '잎 황화·탈립 전 적기 수확.' },
        { week: '3~4주차', task: '건조·저장', detail: '건조 후 습도 관리하며 저장.' },
      ],
    },
    cabbage: {
      sow: () => [
        { week: '1~2주차', task: '육묘·토양 준비', detail: '3~5월 육묘·정식. pH 6.0~6.5·유기물 투입.' },
        { week: '3~4주차', task: '정식·활착', detail: '정식 후 관수·1차 추비. 멀칭 유지.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '결구 관리', detail: '결구 시작 전 2차 추비·칼슘 엽면시비.' },
        { week: '3~4주차', task: '병해 예찰', detail: '무름병·배추좀나방 예찰. 배수 점검.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '적기 수확', detail: '결구 단단·심엽 황화 전 수확.' },
        { week: '3~4주차', task: '출하·후작', detail: '예냉·출하. 잔재물 정리.' },
      ],
    },
    ginseng: {
      sow: () => [
        { week: '1~2주차', task: '정식 준비', detail: '8~9월 정식. 차광·배수 시설 점검.' },
        { week: '3~4주차', task: '정식·월동', detail: '정식 후 토양 습도 관리. 겨울 차광·보온.' },
      ],
      growth: () => [
        { week: '1~2주차', task: '생육·차광', detail: '연차별 차광율 조절. 가루깍지벌레 예찰.' },
        { week: '3~4주차', task: '중기 관리', detail: '병반·고사주 제거. 토양 산성화 방지.' },
      ],
      harvest: () => [
        { week: '1~2주차', task: '수확·선별', detail: '연근·품질 기준에 맞춰 수확·선별.' },
        { week: '3~4주차', task: '건조·저장', detail: '건조·저장 조건(습도·온도) 준수.' },
      ],
    },
    generic: {
      sow: () => [
        { week: '1~2주차', task: '토양·파종 준비', detail: `${name} 재배에 맞게 밭 정리·밑비료 투입. ${temp}` },
        {
          week: '3~4주차',
          task: '파종·정식',
          detail: '파종 또는 정식 실시. 활착까지 관수 유지.',
          ...(isFirst ? { tip: '토양 검정 결과에 맞춰 시비량을 조절하세요.' } : {}),
        },
      ],
      growth: () => [
        { week: '1~2주차', task: '생육 관리', detail: '잡초·병해충 예찰. 2차 추비(생육 상태에 따라).' },
        { week: '3~4주차', task: '중기 점검', detail: `${pests} 주의. 장마·가뭄 대비 물·배수 관리.` },
      ],
      harvest: () => [
        { week: '1~2주차', task: '수확 준비', detail: '성숙도·상품성 기준 확인. 수확·출하 준비.' },
        { week: '3~4주차', task: '수확·정리', detail: '적기 수확·예냉(필요 시). 잔재물 정리·후작 계획.' },
      ],
    },
  };

  const tasks = byKind[kind][type]();
  if (isFirst && type === 'sow' && tasks.length > 0) {
    const { sowing } = resolveSowingHarvestPeriods(rec);
    if (sowing) {
      tasks[0] = {
        ...tasks[0],
        detail: `${tasks[0].detail} (파종 적기: ${sowing})`,
      };
    }
  }
  if (isLast && type === 'harvest' && tasks.length > 1) {
    const { harvest } = resolveSowingHarvestPeriods(rec);
    if (harvest) {
      const last = tasks[tasks.length - 1];
      tasks[tasks.length - 1] = {
        ...last,
        detail: `${last.detail} (수확 시기: ${harvest})`,
      };
    }
  }
  return tasks;
}

function buildGeneratedMonth(
  rec: CropRecommendation,
  kind: CropPlanKind,
  month: number,
  phases: CalendarPhase[],
  monthIdx: number,
  totalMonths: number,
): MonthlyPlan {
  const type = phaseTypeForMonth(month, phases);
  return {
    month,
    phase: phaseTitle(kind, type, month),
    phaseColor: phaseColor(month, phases),
    weeks: buildWeeks(kind, type, rec, month, monthIdx, totalMonths),
  };
}

/** rec + phases → 세부 계획서 전체 */
export function buildDetailedPlanFromRecommendation(
  rec: CropRecommendation,
  phases: CalendarPhase[],
): CropDetailedPlan {
  const months = enumerateMonthsInCultivationOrder(phases);
  const kind = resolveCropPlanKind(rec.cropName);

  const plans = months.map((month, idx) =>
    buildGeneratedMonth(rec, kind, month, phases, idx, months.length),
  );

  return {
    cropName: rec.cropName,
    totalDuration: buildTotalDurationLabel(rec, phases),
    plans,
  };
}
