/**
 * 추천 rec·캘린더 phases 기준 세부 계획서(월별·주별) 생성
 */

import type { CalendarPhase, CropRecommendation } from './recommend.types';
import type { CropDetailedPlan, MonthlyPlan, WeeklyTask } from './calendarPlanData';
import {
  buildMonthPhaseSchedule,
  buildTotalDurationLabel,
  resolveSowingHarvestPeriods,
  type MonthPhaseSlot,
} from './cropCalendarSync';
import { resolveCropPlanKind, type CropPlanKind } from './cropPeriodRegistry';

type PhaseType = 'sow' | 'growth' | 'harvest';
type ProgressBand = 'early' | 'mid' | 'late';

interface TaskDef {
  task: string;
  detail: string;
  tip?: string;
}

type TaskTemplateKey =
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

function resolveTaskTemplateKey(kind: CropPlanKind): TaskTemplateKey {
  switch (kind) {
    case 'rice':
    case 'barley':
    case 'pepper':
    case 'cherry_tomato':
    case 'tomato':
    case 'potato':
    case 'sweet_potato':
    case 'soybean':
    case 'cabbage':
    case 'ginseng':
    case 'generic':
      return kind;
    case 'garlic':
      return 'barley';
    case 'radish':
      return 'cabbage';
    case 'melon':
      return 'cherry_tomato';
    case 'corn':
      return 'rice';
    case 'leafy':
    case 'fruit':
    case 'onion':
    default:
      return 'generic';
  }
}

function phaseTypeFromPhase(phase: CalendarPhase): PhaseType {
  const label = phase.label;
  if (label.includes('수확')) return 'harvest';
  if (
    label.includes('파종')
    || label.includes('육묘')
    || label.includes('종구')
    || label.includes('모종')
    || label.includes('정식')
  ) {
    return 'sow';
  }
  return 'growth';
}

function progressBand(indexInPhase: number, totalInPhase: number): ProgressBand {
  if (totalInPhase <= 1) return 'mid';
  const ratio = indexInPhase / (totalInPhase - 1);
  if (ratio < 0.34) return 'early';
  if (ratio < 0.67) return 'mid';
  return 'late';
}

function weekLabels(month: number): { w1: string; w2: string } {
  return { w1: `${month}월 1~2주`, w2: `${month}월 3~4주` };
}

function phaseStepLabel(slot: MonthPhaseSlot): string {
  if (slot.totalInPhase <= 1) return '';
  return ` (${slot.indexInPhase + 1}/${slot.totalInPhase}개월차)`;
}

function toWeeklyTasks(
  month: number,
  pair: [TaskDef, TaskDef],
  slot: MonthPhaseSlot,
): WeeklyTask[] {
  const { w1, w2 } = weekLabels(month);
  const step = phaseStepLabel(slot);
  return [
    { week: w1, task: pair[0].task, detail: `${pair[0].detail}${step}`, tip: pair[0].tip },
    { week: w2, task: pair[1].task, detail: `${pair[1].detail}${step}`, tip: pair[1].tip },
  ];
}

function buildTaskContext(rec: CropRecommendation) {
  const name = rec.cropName;
  const pests = rec.pests?.length ? rec.pests.join(', ') : '병해충';
  const temp = rec.optimalTemp ? `적정 온도 ${rec.optimalTemp}. ` : '';
  const { sowing, harvest } = resolveSowingHarvestPeriods(rec);
  return { name, pests, temp, sowing, harvest };
}

function getTaskPair(
  kind: CropPlanKind,
  type: PhaseType,
  band: ProgressBand,
  ctx: ReturnType<typeof buildTaskContext>,
  slot: MonthPhaseSlot,
): [TaskDef, TaskDef] {
  const { name, pests, temp, sowing, harvest } = ctx;
  const month = slot.month;
  const isFirst = slot.cycleIndex === 0;
  const isLast = slot.cycleIndex === slot.totalCycleMonths - 1;

  const tasks: Record<TaskTemplateKey, Record<PhaseType, Record<ProgressBand, [TaskDef, TaskDef]>>> = {
    rice: {
      sow: {
        early: [
          { task: '모내기 준비', detail: `${month}월 — 논 정리·밭다리 보수. 육묘(본잎 3~4매) 상태 점검.` },
          { task: '이앙 시기 검토', detail: `${temp}${sowing ? `파종 적기 ${sowing}. ` : ''}기온 15°C 이상 안정 후 이앙.` },
        ],
        mid: [
          { task: '모내기', detail: `${month}월 — 이앙 실시·초기 수심 3~5cm 유지.` },
          { task: '활착 관리', detail: '이앙 후 7~10일간 물 깊이·유모 관리로 활착 촉진.' },
        ],
        late: [
          { task: '분얼 전 관리', detail: `${month}월 — 분얼 시작 전 잡초·물 관리.` },
          { task: '초기 시비', detail: '지역 권장량 기준 질소 1차 시비·배수로 점검.' },
        ],
      },
      growth: {
        early: [
          { task: '분얼·관수', detail: `${month}월 — 유효 분얼 촉진을 위한 물 관리.` },
          { task: '잡초 방제', detail: '이랑·로 간 잡초 제거·중경 1차.' },
        ],
        mid: [
          { task: '중기 생육', detail: `${month}월 — ${temp}물 깊이 5~8cm 유지.` },
          { task: '병해 예찰', detail: `잎집무늬마름병·멸구류(${pests}) 예찰·예방.` },
        ],
        late: [
          { task: '출수·결실 관리', detail: `${month}월 — 출수 전후 물·질소 과다 주의.` },
          { task: '등숙 준비', detail: '바람·도복 방지·배수로 정비.' },
        ],
      },
      harvest: {
        early: [
          { task: '성숙도 확인', detail: `${month}월 — 이삭 80% 황색·수분 20~24% 전후 점검.` },
          { task: '수확 준비', detail: `${harvest ? `수확 적기 ${harvest}. ` : ''}건조·저장 시설 점검.` },
        ],
        mid: [
          { task: '수확', detail: `${month}월 — 조기·지연 수확에 따른 도체·습도 관리.` },
          { task: '건조', detail: '수확 후 신속 건조·저장 습도 관리.' },
        ],
        late: [
          { task: '후순 수확', detail: `${month}월 — 잔여 구역 수확·짚 처리.` },
          { task: '후작 계획', detail: '논 정리·겨울작물·다음 시즌 계획 수립.', tip: isLast ? '수확 직후 방치 시 쌀알 변색·곰팡이 위험이 있습니다.' : undefined },
        ],
      },
    },
    barley: {
      sow: {
        early: [
          { task: '파종 준비', detail: `${month}월 — 밭갈이·밑거름(퇴비·인산) 투입.` },
          { task: '종자 점검', detail: `${sowing ? `파종 적기 ${sowing}. ` : ''}발아율·종자 소독.` },
        ],
        mid: [
          { task: '파종', detail: `${month}월 — ${name} 파종·압실.` },
          { task: '초기 관리', detail: '파종 후 배수·초기 관수.' },
        ],
        late: [
          { task: '월동 준비', detail: `${month}월 — 월동 전 토양·배수 상태 점검.` },
          { task: '보온·배수', detail: '겨울철 배수로·답면 정리.' },
        ],
      },
      growth: {
        early: [
          { task: '월동 관리', detail: `${month}월 — 월동기 배수·동해 점검.` },
          { task: '봄 추비 준비', detail: '2차 추비(질소) 계획·잡초 예찰.' },
        ],
        mid: [
          { task: '봄 생육', detail: `${month}월 — 생육 촉진 추비.` },
          { task: '병해 예찰', detail: '줄무늬병·붉은곰팡이병 예찰.' },
        ],
        late: [
          { task: '결실·등숙', detail: `${month}월 — 등숙기 물·영양 관리.` },
          { task: '수확 준비', detail: `${harvest ? `수확 예정 ${harvest}. ` : ''}장비·건조 준비.` },
        ],
      },
      harvest: {
        early: [
          { task: '적기 수확', detail: `${month}월 — 이삭 황색화 90% 이상.` },
          { task: '기상 대응', detail: '우천 전 조기 수확 검토.' },
        ],
        mid: [
          { task: '건조·조치', detail: `${month}월 — 수확물 건조·정선.` },
          { task: '짚 처리', detail: '짚·잔재 처리·토양 반환.' },
        ],
        late: [
          { task: '후작 준비', detail: `${month}월 — 다음 작물(콩·옥수수 등) 계획.` },
          { task: '토양 정리', detail: '밭 정리·밑거름 준비.' },
        ],
      },
    },
    pepper: {
      sow: {
        early: [
          { task: '육묘 준비', detail: `${month}월 — 종자 소독·육묘상 준비.` },
          { task: '파종·육묘', detail: `${sowing ? `파종·정식 적기 ${sowing}. ` : ''}온도·광량 관리.` },
        ],
        mid: [
          { task: '정식 준비', detail: `${month}월 — 이랑·멀칭·지주 설치.` },
          { task: '정식', detail: '정식 후 관수·활착 관리.' },
        ],
        late: [
          { task: '활착·초기 관리', detail: `${month}월 — 곁순 제거·1차 추비.` },
          { task: '인산 위주 시비', detail: '활착기 인산 위주 액비.', tip: isFirst ? '활착기 질소 과다는 약해를 유발합니다.' : undefined },
        ],
      },
      growth: {
        early: [
          { task: '유인·적엽', detail: `${month}월 — 지주 유인·통풍 확보.` },
          { task: '병해 예찰', detail: `탄저병·진딧물(${pests}) 예찰.` },
        ],
        mid: [
          { task: '착과 관리', detail: `${month}월 — ${temp}과실 떨어짐·착과 점검.` },
          { task: '관수 조절', detail: '장마·고온기 점적관수·배수.' },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 추비·볏짚 멀칭(고온기).` },
          { task: '수확 준비', detail: `${harvest ? `수확 시기 ${harvest}. ` : ''}출하 계획.` },
        ],
      },
      harvest: {
        early: [
          { task: '풋·홍 수확', detail: `${month}월 — 출하 목적에 맞춰 수확 시기 조절.` },
          { task: '수확 리듬', detail: '3~5일 간격 수확·선별.' },
        ],
        mid: [
          { task: '본수확', detail: `${month}월 — 품질·색상 기준 수확.` },
          { task: '예찰 유지', detail: '후기 병해충·과실 품질 점검.' },
        ],
        late: [
          { task: '후기 수확', detail: `${month}월 — 서리 전 잔여 과실 수확.` },
          { task: '포장 정리', detail: '고추대·잔재물 정리.' },
        ],
      },
    },
    cherry_tomato: {
      sow: {
        early: [
          { task: '파종·육묘', detail: `${month}월 — 플러그 파종·발아 관리.` },
          { task: '육묘 관리', detail: `${sowing ? `파종 적기 ${sowing}. ` : ''}온도·광량.` },
        ],
        mid: [
          { task: '정식 준비', detail: `${month}월 — 밑비료·지주·유인줄.` },
          { task: '경화', detail: '정식 직전 경화·활착 준비.' },
        ],
        late: [
          { task: '정식·활착', detail: `${month}월 — 정식 후 관수.` },
          { task: '초기 유인', detail: '곁순·화방 정리 시작.' },
        ],
      },
      growth: {
        early: [
          { task: '유인·적심', detail: `${month}월 — 곁순 제거·화방 정리.` },
          { task: '칼슘 엽면', detail: '열과 예방 칼슘 엽면시비.' },
        ],
        mid: [
          { task: '착과 관리', detail: `${month}월 — ${temp}통풍·적엽.` },
          { task: '병해 예방', detail: '곰팡이병·흰가루병 예찰.' },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 추비·환기 강화.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}수확 도구·출하 준비.` },
        ],
      },
      harvest: {
        early: [
          { task: '착색 수확', detail: `${month}월 — 완숙 착색 후 아침 수확.` },
          { task: '수확 리듬', detail: '주 2~3회 수확 유지.' },
        ],
        mid: [
          { task: '품질 관리', detail: `${month}월 — 등급 선별·예냉.` },
          { task: '병해 점검', detail: '후기 병해·과실 품질.' },
        ],
        late: [
          { task: '마무리 수확', detail: `${month}월 — 잔여 과실 수확.` },
          { task: '시설 정비', detail: isLast ? '시설 정비·다음 시즌 종자 준비.' : '품질 저하 과실 제거.' },
        ],
      },
    },
    tomato: {
      sow: {
        early: [
          { task: '육묘', detail: `${month}월 — 육묘·발아 관리.` },
          { task: '토양 준비', detail: `${sowing ? `정식 적기 ${sowing}. ` : ''}pH 6.0~6.8.` },
        ],
        mid: [
          { task: '정식', detail: `${month}월 — 정식·활착 관리.` },
          { task: '1차 추비', detail: '정식 후 1차 추비·유인 시작.' },
        ],
        late: [
          { task: '초기 유인', detail: `${month}월 — 곁순·지주 유인.` },
          { task: '통풍', detail: '적엽·밀식 방지.' },
        ],
      },
      growth: {
        early: [
          { task: '생육 관리', detail: `${month}월 — ${temp}통풍·적엽.` },
          { task: '예찰', detail: `진딧물·곰팡이병(${pests}) 예찰.` },
        ],
        mid: [
          { task: '착과 관리', detail: `${month}월 — 칼슘·붕소 엽면시비.` },
          { task: '관수', detail: '과습 시 역병 주의.' },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 추비 조절.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}출하 준비.` },
        ],
      },
      harvest: {
        early: [
          { task: '수확 시작', detail: `${month}월 — 적기·등급별 수확.` },
          { task: '예냉', detail: '고온기 수확물 예냉.' },
        ],
        mid: [
          { task: '본수확', detail: `${month}월 — 품질·당도 기준 수확.` },
          { task: '병해 점검', detail: '후기 잿빛곰팡이병 등 예찰.' },
        ],
        late: [
          { task: '후기 수확', detail: `${month}월 — 잔여 과실 수확.` },
          { task: '정리', detail: '포장·잔재물 정리.' },
        ],
      },
    },
    potato: {
      sow: {
        early: [
          { task: '종구 준비', detail: `${month}월 — 종구 소독·절단면 건조.` },
          { task: '밭 정리', detail: `${sowing ? `파종 적기 ${sowing}. ` : ''}이랑·밑거름.` },
        ],
        mid: [
          { task: '파종', detail: `${month}월 — ${name} 파종.` },
          { task: '출현 전 관리', detail: '출현 전후 관수·1차 추비.' },
        ],
        late: [
          { task: '출현·활착', detail: `${month}월 — 출현 확인·서리 피해 점검.` },
          { task: '초기 경농', detail: '북주기 준비·잡초 방제.' },
        ],
      },
      growth: {
        early: [
          { task: '경농', detail: `${month}월 — 북주기·토양 산화 방지.` },
          { task: '배수', detail: '역병 예방 배수 관리.' },
        ],
        mid: [
          { task: '중기 생육', detail: `${month}월 — ${temp}가루뿌리병·진딧물 예찰.` },
          { task: '관수', detail: '과습 금지·이랑 유지.' },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 덩이줄기 비대.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}성숙도 점검.` },
        ],
      },
      harvest: {
        early: [
          { task: '성숙 확인', detail: `${month}월 — 줄기 황화·껍질 경화.` },
          { task: '수확', detail: '적기 수확·등급 선별.' },
        ],
        mid: [
          { task: '저장 준비', detail: `${month}월 — 해침·광색 방지.` },
          { task: '저장고', detail: '저장고 환기·습도 관리.' },
        ],
        late: [
          { task: '출하', detail: `${month}월 — 출하·품질 유지.` },
          { task: '후작', detail: '밭 정리·다음 작물 계획.' },
        ],
      },
    },
    sweet_potato: {
      sow: {
        early: [
          { task: '모종 준비', detail: `${month}월 — 모종·절단면 건조.` },
          { task: '밭 정리', detail: `${sowing ? `정식 ${sowing}. ` : ''}이랑·밑거름.` },
        ],
        mid: [
          { task: '정식', detail: `${month}월 — ${name} 정식.` },
          { task: '멀칭', detail: '덮참·멀칭으로 잡초 억제.' },
        ],
        late: [
          { task: '활착', detail: `${month}월 — 초기 관수·1차 추비.` },
          { task: '유인', detail: '줄기 유인(필요 시).' },
        ],
      },
      growth: {
        early: [
          { task: '덩굴 관리', detail: `${month}월 — 불필요 덩굴 정리.` },
          { task: '토양', detail: '건조도 유지·배수.' },
        ],
        mid: [
          { task: '중기 생육', detail: `${month}월 — 뿌리 비대 전 물·양분.` },
          { task: '병해', detail: `검은무늬병(${pests}) 예찰.` },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 덩이뿌리 비대.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}첫 서리 전 계획.` },
        ],
      },
      harvest: {
        early: [
          { task: '수확', detail: `${month}월 — 서리 전 수확.` },
          { task: '취급', detail: '블루링 방지·가벼운 취급.' },
        ],
        mid: [
          { task: '저장', detail: `${month}월 — 13~16°C·습도 85% 저장.` },
          { task: '선별', detail: '손상块 제거·등급 분류.' },
        ],
        late: [
          { task: '출하', detail: `${month}월 — 출하·품질 관리.` },
          { task: '후작', detail: '밭 정리.' },
        ],
      },
    },
    soybean: {
      sow: {
        early: [
          { task: '파종 준비', detail: `${month}월 — 밭갈이·밑거름.` },
          { task: '파종', detail: `${sowing ? `파종 ${sowing}. ` : ''}접종균(관행 시).` },
        ],
        mid: [
          { task: '출현', detail: `${month}월 — 출현 확인.` },
          { task: '잡초', detail: '초기 잡초 방제.' },
        ],
        late: [
          { task: '초기 생육', detail: `${month}월 — 과습 시 뿌리 부패 주의.` },
          { task: '중경', detail: '중경·배수 점검.' },
        ],
      },
      growth: {
        early: [
          { task: '중기 관리', detail: `${month}월 — 결실기 물 관리.` },
          { task: '예찰', detail: `붉은병·가루깍지벌레(${pests}).` },
        ],
        mid: [
          { task: '결실', detail: `${month}월 — 등숙기 물 부족 방지.` },
          { task: '추비', detail: '생육 상태에 따른 추비.' },
        ],
        late: [
          { task: '등숙', detail: `${month}월 — 등숙·낙화 점검.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}건조 준비.` },
        ],
      },
      harvest: {
        early: [
          { task: '수확', detail: `${month}월 — 잎 황화·탈립 전 적기.` },
          { task: '건조', detail: '건조·습도 관리.' },
        ],
        mid: [
          { task: '저장', detail: `${month}월 — 저장·선별.` },
          { task: '출하', detail: '품질 기준 출하.' },
        ],
        late: [
          { task: '후작', detail: `${month}월 — 밭 정리.` },
          { task: '윤작', detail: '다음 작물 계획.' },
        ],
      },
    },
    cabbage: {
      sow: {
        early: [
          { task: '육묘', detail: `${month}월 — 육묘·토양 pH 6.0~6.5.` },
          { task: '준비', detail: `${sowing ? `정식 ${sowing}. ` : ''}유기물 투입.` },
        ],
        mid: [
          { task: '정식', detail: `${month}월 — 정식·멀칭.` },
          { task: '활착', detail: '정식 후 관수·1차 추비.' },
        ],
        late: [
          { task: '초기 관리', detail: `${month}월 — 멀칭 유지·잡초.` },
          { task: '결구 준비', detail: '결구 시작 전 2차 추비 준비.' },
        ],
      },
      growth: {
        early: [
          { task: '결구 시작', detail: `${month}월 — 결구·칼슘 엽면시비.` },
          { task: '시비', detail: '2차 추비·물 관리.' },
        ],
        mid: [
          { task: '결구 관리', detail: `${month}월 — ${temp}결구·심엽 상태.` },
          { task: '병해', detail: `무름병·배추좀나방(${pests}) 예찰.` },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 배수·통풍.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}결구 단단함 점검.` },
        ],
      },
      harvest: {
        early: [
          { task: '수확', detail: `${month}월 — 결구 단단·심엽 황화 전.` },
          { task: '예냉', detail: '예냉·출하 준비.' },
        ],
        mid: [
          { task: '출하', detail: `${month}월 — 등급별 출하.` },
          { task: '품질', detail: '저장·운송 품질 관리.' },
        ],
        late: [
          { task: '후작', detail: `${month}월 — 잔재물 정리.` },
          { task: '토양', detail: '밭 정리·다음 작물.' },
        ],
      },
    },
    ginseng: {
      sow: {
        early: [
          { task: '정식 준비', detail: `${month}월 — 차광·배수 시설.` },
          { task: '정식', detail: `${sowing ? `정식 ${sowing}. ` : ''}종자·뿌리 상태.` },
        ],
        mid: [
          { task: '월동 관리', detail: `${month}월 — 토양 습도·차광.` },
          { task: '보온', detail: '겨울 보온·배수.' },
        ],
        late: [
          { task: '월동 후', detail: `${month}월 — 월동 후 생육 점검.` },
          { task: '시비', detail: '연차별 시비 계획.' },
        ],
      },
      growth: {
        early: [
          { task: '생육·차광', detail: `${month}월 — 연차별 차광율.` },
          { task: '예찰', detail: `가루깍지벌레(${pests}) 예찰.` },
        ],
        mid: [
          { task: '중기 관리', detail: `${month}월 — 병반·고사주 제거.` },
          { task: '토양', detail: '산성화 방지·배수.' },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 생육·품질 점검.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}연근·품질 기준.` },
        ],
      },
      harvest: {
        early: [
          { task: '수확·선별', detail: `${month}월 — 연근·품질 기준 수확.` },
          { task: '선별', detail: '크기·손상 선별.' },
        ],
        mid: [
          { task: '건조', detail: `${month}월 — 건조 조건 준수.` },
          { task: '저장', detail: '습도·온도 관리.' },
        ],
        late: [
          { task: '출하', detail: `${month}월 — 출하·품질 관리.` },
          { task: '후작', detail: '재배지 정리.' },
        ],
      },
    },
    generic: {
      sow: {
        early: [
          { task: '토양·종자 준비', detail: `${month}월 — ${name} 재배용 밭 정리·밑비료. ${temp}` },
          { task: '파종 준비', detail: `${sowing ? `파종 적기 ${sowing}. ` : ''}종자·묘 상태 점검.` },
        ],
        mid: [
          { task: '파종·정식', detail: `${month}월 — 파종 또는 정식 실시.` },
          { task: '활착', detail: '활착까지 관수·멀칭 유지.' },
        ],
        late: [
          { task: '초기 관리', detail: `${month}월 — 잡초·병해충 초기 예찰.` },
          { task: '1차 추비', detail: '토양 검정 기준 시비.', tip: isFirst ? '토양 검정 결과에 맞춰 시비량을 조절하세요.' : undefined },
        ],
      },
      growth: {
        early: [
          { task: '초기 생육', detail: `${month}월 — ${temp}잡초·물 관리.` },
          { task: '예찰', detail: `${pests} 예찰·예방.` },
        ],
        mid: [
          { task: '중기 생육', detail: `${month}월 — 2차 추비·통풍.` },
          { task: '병해충', detail: '장마·가뭄 대비 물·배수.' },
        ],
        late: [
          { task: '후기 생육', detail: `${month}월 — 생육·결실 상태 점검.` },
          { task: '수확 준비', detail: `${harvest ? `수확 ${harvest}. ` : ''}성숙도 확인.` },
        ],
      },
      harvest: {
        early: [
          { task: '성숙 확인', detail: `${month}월 — 성숙도·상품성 기준.` },
          { task: '수확 준비', detail: '수확·출하 준비.' },
        ],
        mid: [
          { task: '수확', detail: `${month}월 — 적기 수확·선별.` },
          { task: '출하', detail: '예냉(필요 시)·출하.' },
        ],
        late: [
          { task: '후기 수확', detail: `${month}월 — 잔여 수확.` },
          { task: '정리', detail: '잔재물 정리·후작 계획.', tip: isLast ? '수확 후 잔재물 방치는 다음 시즌 병해충 원인이 됩니다.' : undefined },
        ],
      },
    },
  };

  const bucket = resolveTaskTemplateKey(kind);
  return tasks[bucket][type][band];
}

function buildWeeksForSlot(
  kind: CropPlanKind,
  type: PhaseType,
  rec: CropRecommendation,
  slot: MonthPhaseSlot,
): WeeklyTask[] {
  const ctx = buildTaskContext(rec);
  const band = progressBand(slot.indexInPhase, slot.totalInPhase);
  const pair = getTaskPair(kind, type, band, ctx, slot);
  return toWeeklyTasks(slot.month, pair, slot);
}

function buildGeneratedMonth(
  rec: CropRecommendation,
  kind: CropPlanKind,
  slot: MonthPhaseSlot,
): MonthlyPlan {
  const type = phaseTypeFromPhase(slot.phase);
  return {
    month: slot.month,
    phase: `${slot.month}월 · ${slot.phase.label}`,
    phaseColor: slot.phase.color,
    weeks: buildWeeksForSlot(kind, type, rec, slot),
  };
}

/** rec + phases → 세부 계획서 전체 */
export function buildDetailedPlanFromRecommendation(
  rec: CropRecommendation,
  phases: CalendarPhase[],
): CropDetailedPlan {
  const schedule = buildMonthPhaseSchedule(phases);
  const kind = resolveCropPlanKind(rec.cropName);

  const plans = schedule.map((slot) => buildGeneratedMonth(rec, kind, slot));

  return {
    cropName: rec.cropName,
    totalDuration: buildTotalDurationLabel(rec, phases),
    plans,
  };
}
