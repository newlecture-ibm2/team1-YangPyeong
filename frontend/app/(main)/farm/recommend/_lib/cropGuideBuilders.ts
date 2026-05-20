/**
 * 작물·농장·재배 경험에 맞춰 가이드 토픽 본문 생성
 */

import type { CropRecommendation, CropRecommendResponse, CropCategory } from './recommend.types';

export type GrowerExperience = 'novice' | 'experienced';

type FarmInfo = CropRecommendResponse['farmInfo'];

type CropTemplate =
  | 'cabbage'
  | 'pepper'
  | 'tomato'
  | 'leafy'
  | 'root'
  | 'fruit'
  | 'grain'
  | 'legume'
  | 'generic';

function norm(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

function resolveCropTemplate(rec: CropRecommendation): CropTemplate {
  const n = norm(rec.cropName);
  if (n.includes('배추') || n.includes('무') || n.includes('브로콜리') || n.includes('양배추')) {
    return 'cabbage';
  }
  if (n.includes('고추') || n.includes('피망') || n.includes('가지')) return 'pepper';
  if (n.includes('토마토') || n.includes('방울')) return 'tomato';
  if (n.includes('감자') || n.includes('고구마') || n.includes('당근') || n.includes('마늘')) {
    return 'root';
  }
  if (n.includes('콩') || n.includes('팥') || n.includes('감')) return 'legume';
  if (n.includes('쌀') || n.includes('벼') || n.includes('보리') || n.includes('밀')) return 'grain';
  if (n.includes('딸기') || n.includes('포도') || n.includes('사과') || n.includes('배')) return 'fruit';

  switch (rec.category) {
    case '채소류':
      return 'leafy';
    case '과일류':
      return 'fruit';
    case '곡물':
      return 'grain';
    case '특용작물':
      return 'root';
    default:
      return 'generic';
  }
}

/**
 * 재배 경험 수준 (캐시 키·UI용).
 * 수확 이력은 백엔드 CultivationContext에서 보정하므로, 프론트는 adviceType·recommendMode 기준.
 */
export function resolveGrowerExperience(
  rec: CropRecommendation,
  result?: CropRecommendResponse | null,
): GrowerExperience {
  if (rec.adviceType === 'IN_SEASON_COACHING') return 'experienced';

  const sameCrop = result?.currentCropAdvices?.find((c) => c.cropId === rec.cropId);
  if (sameCrop?.adviceType === 'IN_SEASON_COACHING') return 'experienced';

  if (
    rec.adviceType === 'PLANNED_CROP' ||
    rec.adviceType === 'NEW_RECOMMEND' ||
    rec.adviceType === 'NEXT_SEASON'
  ) {
    return 'novice';
  }

  return 'novice';
}

function farmSoilLine(farm?: FarmInfo): string {
  if (!farm) return '';
  const parts: string[] = [];
  if (farm.soilPh != null) parts.push(`pH ${farm.soilPh}`);
  if (farm.soilType) parts.push(`토성 ${farm.soilType}`);
  if (farm.organicMatter != null) parts.push(`유기물 ${farm.organicMatter}%`);
  if (parts.length === 0) return '';
  return `현재 농장(${farm.name}) 토양: ${parts.join(', ')}. `;
}

function periodLine(rec: CropRecommendation): string {
  const parts: string[] = [];
  if (rec.sowingPeriod) parts.push(`파종 적기 ${rec.sowingPeriod}`);
  if (rec.harvestPeriod) parts.push(`수확 시기 ${rec.harvestPeriod}`);
  if (rec.growthDays) parts.push(`생육 기간 약 ${rec.growthDays}일`);
  if (rec.optimalTemp) parts.push(`적정 온도 ${rec.optimalTemp}`);
  return parts.length ? parts.join(' · ') + '.' : '';
}

export function buildSoilWaterContent(rec: CropRecommendation, farm?: FarmInfo): string[] {
  const t = resolveCropTemplate(rec);
  const base = farmSoilLine(farm);
  const period = periodLine(rec);

  const byTemplate: Record<CropTemplate, string[]> = {
    cabbage: [
      `${base}${rec.cropName}은 결구형 엽채류로 수분 요구가 크지만 과습에 취약합니다. ${period}`,
      '목표 pH 6.0~6.5. pH가 낮으면 고토석회·소석회를 밑거름으로 시용하고 2~3주 후 정식하세요.',
      '유기물 3% 이상: 완숙 퇴비·부숙 유기질을 10a당 2,000~3,000kg 투입, 이랑 높이 20cm 이상·배수로 정비.',
      '수분 60~70% 유지. 점적관수·이랑 재배로 잎이 습하지 않게 하고, 장마철 배수 점검을 매일 합니다.',
      '질소는 초기·중기 위주, 결구 시작 후 질소 과다는 내부 썩음·벌어짐의 원인입니다.',
    ],
    pepper: [
      `${base}${rec.cropName}은 온도·배수에 민감한 과채류입니다. ${period}`,
      'pH 6.0~6.5, 3~4년 윤작(고추→배추→콩→밭작물)으로 토양 전염병을 줄이세요.',
      '과습 금지. 점적관수로 65~75% 수분, 고랑 경사·배수로를 유지합니다.',
      '개화~착과기 칼슘 결핍(배꼽썩음·끝마름) 예방: 칼슘제 엽면시비·질산칼슘 관주를 2주 간격.',
      '고온기(7~8월) 지온 상승 시 볏짚 멀칭·차광으로 꽃떨이·과실 일소를 막습니다.',
    ],
    tomato: [
      `${base}${rec.cropName}은 시설·노지 모두 EC·수분 관리가 품질을 좌우합니다. ${period}`,
      'pH 6.0~6.5, EC 2.0~3.0 dS/m(토양). 접목묘 사용 시 역병·풋마름병 리스크를 크게 줄일 수 있습니다.',
      '착과·비대기: 낮 수분·야간 건조 리듬이 당도에 유리. 급격한 관수 변동은 열과 원인.',
      '배꼽썩음 예방: 개화부터 질산칼슘 150~200ppm 관주 또는 엽면 칼슘제.',
      '하엽 제거·통풍으로 잿빛곰팡이·곰팡이병 예방, 시설은 야간 습도 70% 이하 목표.',
    ],
    leafy: [
      `${base}${rec.cropName}은 엽채류로 빠른 생육·균일 수분이 핵심입니다. ${period}`,
      'pH 6.0~6.7, 유기물 풍부한 밭. 질소는 분할 시비(소량·자주).',
      '과습 시 무름병·연부병. 이랑 높이기·멀칭으로 잡초·수분 균일화.',
      '하우스·노지 모두 은색 멀칭·방충망으로 진딧물·벌레 유입을 줄입니다.',
    ],
    root: [
      `${base}${rec.cropName}은 뿌리·구근 비대가 목표입니다. ${period}`,
      '산성 비닐·사질토에서도 pH 5.5~6.5 맞추면 수량이 안정됩니다. 배수 필수.',
      '초기 수분 충분 → 중기 약간 건조(뿌리 하향) → 수확 전 과습은 저장성 저하.',
      '칼리·인산 밑거름, 생육 중기 질소 과다는 지상부만 무성해집니다.',
    ],
    legume: [
      `${base}${rec.cropName}은 질소 고정 작물이나 초기 뿌리 활착·배수가 중요합니다. ${period}`,
      'pH 6.0~7.0. 과습·침수에 매우 약하므로 배수로·고랑 재배.',
      '종자 소독·접종균(선택)으로 발아·뿌리 발달 촉진.',
      '개화~결실기 수분 부족 시 꽃떨이·빈립 주의.',
    ],
    grain: [
      `${base}${rec.cropName}은 전량 밑거름·시비 시기가 수확량을 결정합니다. ${period}`,
      'pH 6.0~6.5, 유기물 2% 이상. 질소는 분얼기·수확기에 맞춰 시비.',
      '관개 가능 시 수확기 전 급격한 가뭄만 피하면 됩니다.',
    ],
    fruit: [
      `${base}${rec.cropName}은 다년생·수확 연도 관리가 중요합니다. ${period}`,
      'pH 6.0~6.5, 유기물·칼리·칼슘 균형. 개화 전후 수분 안정.',
      '과실 비대기 질소·칼슘·붕소 관리, 적과로 품질 확보.',
    ],
    generic: [
      `${base}${rec.cropName} 재배에 맞춘 토양·수분 관리입니다. ${period}`,
      '토양 검정으로 pH·유기물·유효 인산을 확인한 뒤 밑거름·웃거름을 나눕니다.',
      '과습·건조 극단을 피하고, 이랑·멀칭·배수로로 뿌리 환경을 안정시키세요.',
      '작물별 적정 온도·파종 시기에 맞춰 관수량을 조절하세요.',
    ],
  };

  return byTemplate[t];
}

export function buildHarvestContent(rec: CropRecommendation, experience: GrowerExperience): string[] {
  const t = resolveCropTemplate(rec);
  const name = rec.cropName;

  const noviceExtra = [
    '첫 수확은 작은 구역에서 시기·방법을 시험한 뒤 본격 출하하세요.',
    '수확 직후 품질 등급(특·상·보통)을 나누면 단가 차이를 체감하기 쉽습니다.',
  ];

  const expertExtra = [
    '출하 채널별(도매·직거래·가공) 요구 규격을 수확 전에 정리하면 선별 비용을 줄일 수 있습니다.',
    '전년 대비 수확일·당도·평균 단가를 기록해 다음 시즌 시비·품종을 조정하세요.',
  ];

  const byTemplate: Record<CropTemplate, string[]> = {
    cabbage: [
      `${name}은 결구 상단이 단단하고 중심이 꽉 차면 수확 적기입니다. 꽃대가 올라오기 전에 출하하세요.`,
      '수확 직후 0~2°C 예냉, 신문지 포기 보관으로 저장 2~3주 가능.',
      '김장·월동 출하는 8~9월 파종 역산으로 시기를 맞추면 시세가 유리합니다.',
    ],
    pepper: [
      '풋고추는 과실이 꽉 차고 광택이 있을 때, 홍고추는 완전 색 전환 후 건조·저장.',
      '건조 목표 수분 14% 이하, 냉동 보관 시 1년 이상 가능.',
      '수확 후 추비(인산·칼륨)로 다음 화방 형성을 돕습니다.',
    ],
    tomato: [
      '완숙(전체 착색) 후 수확 시 당도·향이 최고. 꼭지를 달린 채 포장하면 신선도 유지.',
      '5~10°C, 습도 85~90% 저장. 소포장·당도 측정(굴절계)으로 프리미엄 출하.',
    ],
    leafy: [
      '이른 아침·저녁 수확이 신선도에 유리. 결구·외엽 손상 최소화.',
      '수확 후 즉시 예냉·포장, 엽채류는 저장 기간이 짧아 출하 리듬을 짧게 잡으세요.',
    ],
    root: [
      '지상부 잎이 누렇게 들어갈 때 굴착. 수확 직후 흙 털이·건조·저장(서늘·어둡고 통풍).',
      '상처 없는 구근만 선별 저장. 상처 부위는 당일 출하 또는 가공.',
    ],
    legume: [
      '꽍정이 복실·종피색이 품종 특성에 맞을 때 수확.',
      '건조·저장 시 수분 함량·곰팡이 점검, 통풍 창고 보관.',
    ],
    grain: [
      '수분 함량 13~15% 전후에서 결실 수확. 건조·저장 시 곰팡이·보관충 예방.',
    ],
    fruit: [
      '품종별 착색·당도·경도 기준으로 적과·수확. 예냉·저장 온도는 품종마다 다름.',
    ],
    generic: [
      `${name}의 수확 적기는 ${rec.harvestPeriod || '생육 후기 품종·지역 기준'}을 참고하세요.`,
      '수확 직후 예냉·선별·포장을 빠르게 진행하면 상품성이 유지됩니다.',
      '직거래·도매 채널별 규격에 맞춰 등급을 나누세요.',
    ],
  };

  return [...byTemplate[t], ...(experience === 'experienced' ? expertExtra : noviceExtra)];
}

export function buildTipsContent(rec: CropRecommendation, experience: GrowerExperience): string[] {
  const t = resolveCropTemplate(rec);
  const name = rec.cropName;
  const diff = rec.difficulty ?? 3;
  const diffNote =
    diff >= 4 ? '난이도가 높은 작물이므로 소규모 시범 재배를 권장합니다.' : '';

  if (experience === 'experienced') {
    const expert: Record<CropTemplate, string[]> = {
      cabbage: [
        `${name} 재배 경험이 있으므로 수량·품질 최적화 중심으로 관리하세요. ${diffNote}`,
        '❌ 결구기 질소 과다·장마 직후 방치는 내부 썩음·무름병으로 이어집니다.',
        '✅ 결구 직전 잎 2~3매만 남기고 솎아 결구 균일화. 수확 7일 전 질소 차단.',
        '✅ 품종·파종 시기별 결구 속도를 기록해 다음 시즌 파종 밀도를 조정하세요.',
        '✅ 직거래·김장용 규격별(무게·결구 수) 선별로 단가를 높이세요.',
      ],
      pepper: [
        `${name} 재배 중·경험자용: 화방·착과 균형이 수량을 좌우합니다.`,
        '❌ 방아다리 아래 곁순 방치·장마 후 방제 누락은 탄저·역병으로 연결됩니다.',
        '✅ 1번과 조기 제거, 수확=추비 리듬 유지. 페로몬 트랩으로 나방 예찰.',
        '✅ 건조·신선 출하 채널을 분리해 설비 투자 효율을 높이세요.',
      ],
      tomato: [
        `${name}: 곁순·수분·환기 3요소가 수확량·당도를 결정합니다.`,
        '❌ 곁순 방치·급격 관수 변동은 열과·잿빛곰팡이를 유발합니다.',
        '✅ 생육점·곁순 일일 점검. 진동 수분(꽃가루받이)으로 착과율 보정.',
        '✅ 당도 8 Brix 이상 구간만 프리미엄 라인으로 출하하세요.',
      ],
      leafy: [
        `${name} 연작·작기별 품종 교체로 병해충 압력을 분산하세요.`,
        '✅ 파종 밀도·수확 시기별 단가를 기록해 최적 작기를 고정하세요.',
      ],
      root: [
        `${name}: 파종 깊이·이랑 간격이 구형·단량에 직결됩니다.`,
        '✅ 중기 건조 스트레스로 뿌리 비대 유도(품종별 주의).',
      ],
      legume: [
        `${name}: 결실 전 수분·병해충 예찰이 중요합니다.`,
        '✅ 파종 시기·밀도 기록으로 다음 해 윤작 계획에 반영하세요.',
      ],
      grain: [
        `${name}: 시비 시기·품종별 수확 최적 수분을 관리하세요.`,
        '✅ 도열병·깨씨무늬병 예찰 주기를 품종별로 고정하세요.',
      ],
      fruit: [
        `${name}: 적과·전정 시기가 연간 품질을 좌우합니다.`,
        '✅ 착과 후 4~6주 당도 추이를 기록해 수확 창을 좁히세요.',
      ],
      generic: [
        `${name} 재배 경험을 바탕으로 시비·병해충·출하 시기를 미세 조정하세요.`,
        '✅ 재배 일지에 날짜·관수·시비·방제·수확량을 기록하세요.',
        '✅ 소량 시험 구역으로 신품종·신기술을 먼저 검증하세요.',
      ],
    };
    return expert[t];
  }

  const novice: Record<CropTemplate, string[]> = {
    cabbage: [
      `${name}을 처음 재배하시는 경우 아래 순서를 지키면 실패 확률을 줄일 수 있습니다. ${diffNote}`,
      '❌ 질소만 많이 주면 잎만 크고 결구가 안 됩니다(벌어진 배추).',
      '❌ 정식 직후 물 부족·한낮 정식은 묘가 죽거나 활착률이 떨어집니다.',
      '✅ 흐린 날·오후에 정식하고 3~5일 뿌리 활착수 관리.',
      '✅ 파종·정식·수확 시기를 달력에 적어 두고, 지역 농업기술센터 교육을 활용하세요.',
      '✅ 첫 해는 면적을 작게 잡고 성공 경험을 만든 뒤 확대하세요.',
    ],
    pepper: [
      `${name} 초보 재배: 정식 시기와 배수가 가장 중요합니다.`,
      '❌ 정식 직후 폭우·침수는 역병으로 전멸할 수 있습니다.',
      '❌ 곁순을 안 따면 열매가 작아집니다.',
      '✅ 비 예보 확인 후 정식. 방아다리 아래 잎·곁순 정리.',
      '✅ 첫 수확 전까지 농업기술센터에 병해충 점검을 요청하세요.',
    ],
    tomato: [
      `${name} 첫 재배: 곁순 제거와 물 주기 리듬을 익히는 것이 우선입니다.`,
      '❌ 곁순 방치 시 밭 전체가 숲이 되어 수확 불가.',
      '✅ 매일 10분 곁순·하엽 점검. 물은 “매일 조금”이 안전합니다.',
    ],
    leafy: [
      `${name} 입문: 파종 밀도·물 주기를 작은 밭에서 먼저 익히세요.`,
      '✅ 잡초·진딧물 예찰을 주 2회 습관화하세요.',
    ],
    root: [
      `${name} 첫 재배: 파종 깊이·이랑 간격을 지키고 배수를 확보하세요.`,
      '✅ 수확 시기를 농업기술센터·종자 라벨로 확인하세요.',
    ],
    legume: [
      `${name} 입문: 파종 시기·밀도를 라벨대로 맞추고 과습만 피하세요.`,
      '✅ 첫 해는 시범 면적 30% 이하 권장.',
    ],
    grain: [
      `${name} 입문: 파종 시기·시비량을 지역 권장표를 따르세요.`,
    ],
    fruit: [
      `${name} 입문: 품종·전정·적과 기본 교육을 먼저 이수하세요.`,
    ],
    generic: [
      `${name}을 처음 재배하신다면 아래 기본을 지키세요. ${diffNote}`,
      '❌ 비료 과다·날씨 무시 작업·병든 묘 방치는 흔한 실패 원인입니다.',
      '✅ 소규모 시범 → 기록 → 점진적 확대 순서로 진행하세요.',
      '✅ 지역 농업기술센터 무료 상담을 적극 활용하세요.',
    ],
  };
  return novice[t];
}
