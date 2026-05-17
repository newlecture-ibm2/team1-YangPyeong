/* ════════════════════════════════════════════════════════
   재배 캘린더 — 주별 세부 계획 데이터
   작물 이름으로 매핑된 월-주 단위 실행 가이드
   ════════════════════════════════════════════════════════ */

export interface WeeklyTask {
  week: string;           // 예: "1주차", "2주차"
  task: string;           // 핵심 작업명
  detail: string;         // 상세 실행 내용
  tip?: string;           // 꿀팁 (선택)
}

export interface MonthlyPlan {
  month: number;          // 1~12
  phase: string;          // 대분류: 준비기, 파종기, 생육기 등
  phaseColor: string;     // 시각화 색상
  weeks: WeeklyTask[];
}

export interface CropDetailedPlan {
  cropName: string;
  totalDuration: string;  // 예: "약 120일 (4~8월)"
  plans: MonthlyPlan[];
}

/** 작물별 상세 재배 계획 */
const DETAILED_PLANS: Record<string, CropDetailedPlan> = {
  '유기농 배추': {
    cropName: '유기농 배추',
    totalDuration: '약 150일 (3월 ~ 8월)',
    plans: [
      {
        month: 3, phase: '파종 준비기', phaseColor: '#52B788',
        weeks: [
          { week: '1주차', task: '토양 준비', detail: '밭갈이 및 유기질 퇴비(10a당 2,000kg) 투입. pH 6.0~6.5 맞추기 위해 석회 시용 여부 판단.', tip: '토양 검정을 먼저 받아보면 비료비를 30%까지 절감할 수 있습니다.' },
          { week: '2주차', task: '묘상 설치', detail: '육묘용 트레이(128공) 준비. 상토는 유기 인증 상토를 사용하고, 온도 20~25°C 유지.' },
          { week: '3주차', task: '파종', detail: '트레이에 1~2립씩 파종. 복토 후 충분히 관수. 발아까지 3~5일 소요.', tip: '파종 후 신문지를 덮어두면 수분 증발을 막아 발아율이 높아집니다.' },
          { week: '4주차', task: '발아 관리', detail: '발아 확인 후 피복 제거. 낮 온도 20°C, 야간 15°C 유지. 도장(웃자람) 방지를 위해 환기 실시.' },
        ],
      },
      {
        month: 4, phase: '육묘기', phaseColor: '#74C69D',
        weeks: [
          { week: '1주차', task: '묘 관리', detail: '본잎 2매 전개 시 1본으로 솎아주기. 액비(유기질)로 추비 1회.'},
          { week: '2주차', task: '경화 처리', detail: '정식 7~10일 전부터 야외 노출 시간을 늘려 묘를 단련(경화)시키기.' },
          { week: '3주차', task: '정식 준비', detail: '본포에 이랑 만들기(이랑 폭 60cm, 고랑 40cm). 멀칭 비닐 설치.' },
          { week: '4주차', task: '정식', detail: '본잎 5~6매 시 정식. 주간 거리 35cm. 정식 후 충분 관수.', tip: '오후 늦게 또는 흐린 날 정식하면 활착률이 높아집니다.' },
        ],
      },
      {
        month: 5, phase: '정식·초기 생육기', phaseColor: '#40916C',
        weeks: [
          { week: '1~2주차', task: '활착 관리', detail: '정식 후 5~7일간 매일 관수. 뿌리 활착 확인.' },
          { week: '3~4주차', task: '초기 생육 관리', detail: '잡초 제거 및 1차 추비(유기질 액비). 진딧물 예찰 시작.', tip: '진딧물은 은색 멀칭으로 80% 이상 억제할 수 있습니다.' },
        ],
      },
      {
        month: 6, phase: '생육 관리기', phaseColor: '#2D6A4F',
        weeks: [
          { week: '1주차', task: '2차 추비', detail: '결구 시작 전 2차 추비 시용. 칼슘제 엽면시비로 석회 결핍 예방.' },
          { week: '2주차', task: '병해 예찰', detail: '무름병, 검은썩음병 예찰. 이병주 즉시 제거. 비가 잦으면 배수로 정비.' },
          { week: '3주차', task: '관수 관리', detail: '토양 수분 60~70% 유지. 점적관수 추천. 과습 시 뿌리 부패 주의.' },
          { week: '4주차', task: '결구 촉진', detail: '외엽을 안쪽으로 모아 묶어주기(필요 시). 결구 상태 확인.' },
        ],
      },
      {
        month: 7, phase: '수확 준비기', phaseColor: '#95D5B2',
        weeks: [
          { week: '1~2주차', task: '성숙도 확인', detail: '결구부를 손으로 눌러 단단한 정도 확인. 잎 색이 짙은 녹색이면 아직 미성숙.' },
          { week: '3~4주차', task: '적기 수확', detail: '결구부 상단이 약간 탄력 있을 때가 최적. 이른 아침 서늘할 때 수확.', tip: '수확 후 바로 예냉(0~2°C)하면 신선도가 2배 이상 유지됩니다.' },
        ],
      },
      {
        month: 8, phase: '수확·후작 준비', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '잔여 수확', detail: '남은 배추 일괄 수확 및 출하. 상품성 떨어지는 것은 퇴비용으로 활용.' },
          { week: '3~4주차', task: '후작 준비', detail: '잔재물 정리 후 토양 소독. 가을 배추 또는 후작 작물 파종 준비.' },
        ],
      },
    ],
  },

  '청양고추': {
    cropName: '청양고추',
    totalDuration: '약 240일 (2월 ~ 10월)',
    plans: [
      {
        month: 2, phase: '파종·육묘 시작', phaseColor: '#52B788',
        weeks: [
          { week: '1~2주차', task: '종자 준비', detail: '종자 소독(온탕 소독 55°C, 30분) 후 최아. 육묘 트레이(72공 또는 50공)에 파종.' },
          { week: '3~4주차', task: '온실 관리', detail: '발아 적온 28~30°C 유지. 발아 후 주간 25°C, 야간 18°C로 관리.', tip: '야간 온도가 15°C 이하로 떨어지면 생육이 2주 이상 지연될 수 있습니다.' },
        ],
      },
      {
        month: 3, phase: '육묘기', phaseColor: '#52B788',
        weeks: [
          { week: '1~2주차', task: '묘 관리', detail: '본잎 2~3매 시 큰 묘로 이식(鉢上げ). 액비 500배액으로 주 1회 관주.' },
          { week: '3~4주차', task: '경화 처리', detail: '정식 2주 전부터 낮 시간 하우스 개방하여 외기 적응 훈련.' },
        ],
      },
      {
        month: 4, phase: '육묘 후기', phaseColor: '#52B788',
        weeks: [
          { week: '1~2주차', task: '정식 준비', detail: '본포 이랑 만들기(이랑 120cm, 2줄 심기). 밑비료(퇴비 2t/10a + 유기질 복합비료) 투입.' },
          { week: '3~4주차', task: '멀칭·지주 설치', detail: '흑색 멀칭 비닐 피복. 지주대(150cm) 설치. 유인끈 준비.' },
        ],
      },
      {
        month: 5, phase: '정식기', phaseColor: '#40916C',
        weeks: [
          { week: '1주차', task: '정식', detail: '본잎 12~13매, 1번화 개화 직전에 정식. 주간 45cm. 정식 후 충분 관수.', tip: '활착 촉진을 위해 인산 성분이 풍부한 액비를 정식 시 관주하세요.' },
          { week: '2~3주차', task: '활착·초기 관리', detail: '방아다리(1번 분지) 아래 곁순 모두 제거. 지주에 유인 시작.' },
          { week: '4주차', task: '1차 추비', detail: '정식 3주 후 1차 추비. 질소 과다 주의(웃자람 방지).' },
        ],
      },
      {
        month: 6, phase: '생육기', phaseColor: '#2D6A4F',
        weeks: [
          { week: '1~2주차', task: '유인·적엽', detail: '생장점 유인 및 하엽 제거. 통풍 개선으로 탄저병 예방.' },
          { week: '3~4주차', task: '병해충 방제', detail: '장마 전 탄저병 예방 방제. 담배나방, 총채벌레 예찰.', tip: '장마 직전에 예방적 방제 1회를 실시하면 장마 중 피해를 크게 줄일 수 있습니다.' },
        ],
      },
      {
        month: 7, phase: '1차 수확기', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '풋고추 수확 시작', detail: '개화 후 15~20일, 과실 길이 6~8cm일 때 풋고추 수확. 3~5일 간격 수확.' },
          { week: '3~4주차', task: '2차 추비·관수', detail: '수확 시작 후 2차 추비. 고온기 관수량 증가(점적관수 1일 2회).' },
        ],
      },
      {
        month: 8, phase: '성수기 수확', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '본격 수확', detail: '홍고추 수확 시작(개화 후 45~50일, 과실 전체 착색). 주 2회 수확.' },
          { week: '3~4주차', task: '고온 대응', detail: '35°C 이상 고온 시 차광막 설치. 석과(돌과) 발생 주의.', tip: '오후 3시 이후에 관수하면 야간 고온에 의한 석과를 줄일 수 있습니다.' },
        ],
      },
      {
        month: 9, phase: '후기 수확', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '수확 지속', detail: '기온 하락 시 착색이 느려짐. 잔여 과실 일괄 수확 고려.' },
          { week: '3~4주차', task: '3차 추비(선택)', detail: '생육 상태가 양호하면 추비로 수확 기간 연장. 서리 예보 모니터링 시작.' },
        ],
      },
      {
        month: 10, phase: '마무리 수확·정리', phaseColor: '#95D5B2',
        weeks: [
          { week: '1~2주차', task: '최종 수확', detail: '첫 서리 전 잔여 과실 모두 수확. 미착색 과실은 실내 후숙.' },
          { week: '3~4주차', task: '포장 정리', detail: '고추대 발근·잔재물 정리. 토양 환원(녹비 파종 또는 휴경).' },
        ],
      },
    ],
  },

  '방울토마토': {
    cropName: '방울토마토',
    totalDuration: '약 270일 (2월 ~ 11월)',
    plans: [
      {
        month: 2, phase: '파종기', phaseColor: '#52B788',
        weeks: [
          { week: '1~2주차', task: '종자 파종', detail: '플러그 트레이(128공)에 파종. 발아 적온 25~30°C. 복토 0.5cm.' },
          { week: '3~4주차', task: '발아 관리', detail: '발아 후 주간 23°C, 야간 15°C. 도장 방지를 위해 충분한 광량 확보.', tip: '묘가 웃자라면 선풍기로 바람을 쐬어주면 줄기가 튼튼해집니다.' },
        ],
      },
      {
        month: 3, phase: '육묘기', phaseColor: '#52B788',
        weeks: [
          { week: '1~2주차', task: '이식', detail: '본잎 2~3매 시 12cm 포트로 이식. 인산 중심 액비 관주.' },
          { week: '3~4주차', task: '경화·정식 준비', detail: '본포 토양 경운 및 밑비료 투입. 지주대(2m) 또는 유인줄 설치.' },
        ],
      },
      {
        month: 4, phase: '정식기', phaseColor: '#40916C',
        weeks: [
          { week: '1주차', task: '정식', detail: '본잎 7~8매, 1화방 개화 직전에 정식. 주간 40~45cm.' },
          { week: '2~3주차', task: '활착·곁순 제거', detail: '1단 곁순(측지) 모두 제거하여 단줄기로 유인. 지주에 8자 묶기.' },
          { week: '4주차', task: '1차 추비', detail: '활착 후 2주차에 1차 추비. 칼리 위주로 공급.', tip: '토마토는 칼슘 결핍에 약합니다. 꽃 피기 시작하면 칼슘제 엽면시비를 2주 간격으로 실시하세요.' },
        ],
      },
      {
        month: 5, phase: '1차 수확 시작', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '착과 관리', detail: '1~3화방 착과 확인. 진동 수분(꽃 흔들기) 또는 호르몬 처리.' },
          { week: '3~4주차', task: '수확 시작', detail: '개화 후 40~50일, 과실이 완전 착색되면 수확. 아침 일찍 수확 권장.' },
        ],
      },
      {
        month: 6, phase: '수확 본격기', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '지속 수확·추비', detail: '주 2~3회 수확. 2차 추비. 하엽 제거로 통풍 개선.' },
          { week: '3~4주차', task: '장마 대비', detail: '환기 강화 및 곰팡이성 병해(잿빛곰팡이병) 예방. 배수로 정비.', tip: '장마철에는 관수를 줄이고 칼슘·붕소를 추가 공급하면 열과(裂果)를 줄일 수 있습니다.' },
        ],
      },
      {
        month: 7, phase: '고온기 관리', phaseColor: '#2D6A4F',
        weeks: [
          { week: '1~2주차', task: '고온 대응', detail: '차광막(30~40%) 설치. 관수량 유지. 흰가루병 예찰.' },
          { week: '3~4주차', task: '적심(생장점 제거)', detail: '목표 화방(8~10단)까지 도달하면 생장점 적심. 잔여 양분을 과실로 집중.' },
        ],
      },
      {
        month: 8, phase: '후기 수확', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~2주차', task: '후기 수확', detail: '상위 화방 과실 수확 진행. 품질 저하 과실은 즉시 제거.' },
          { week: '3~4주차', task: '가을 재배 전환(선택)', detail: '가을 재배 계획 시 8월 하순에 새 묘 정식 준비.' },
        ],
      },
      {
        month: 9, phase: '가을 수확', phaseColor: '#CCFF33',
        weeks: [
          { week: '1~4주차', task: '수확 지속', detail: '가을 수확 지속. 야간 온도 하락에 따라 착색 기간이 길어짐. 보온 자재 준비.' },
        ],
      },
      {
        month: 10, phase: '마무리', phaseColor: '#95D5B2',
        weeks: [
          { week: '1~2주차', task: '최종 수확', detail: '서리 전 잔여 과실 모두 수확. 미착색 과실은 상온 후숙.' },
          { week: '3~4주차', task: '포장 정리', detail: '유인줄·지주 회수. 잔재물 정리 후 녹비 작물 파종 또는 휴경.' },
        ],
      },
      {
        month: 11, phase: '후처리', phaseColor: '#B7E4C7',
        weeks: [
          { week: '1~2주차', task: '시설 정비', detail: '하우스 비닐 점검, 보온 자재 정비. 다음 시즌 품종 선정 및 종자 주문.' },
        ],
      },
    ],
  },
};

/** 기본 작물 상세 계획 (매핑되지 않은 작물용) */
const DEFAULT_DETAILED_PLAN: CropDetailedPlan = {
  cropName: '작물',
  totalDuration: '약 120~180일',
  plans: [
    {
      month: 3, phase: '준비기', phaseColor: '#52B788',
      weeks: [
        { week: '1~2주차', task: '토양 준비', detail: '밭갈이 및 밑비료(퇴비, 유기질 비료) 투입. 토양 검정을 통해 pH와 유기물 함량 확인.' },
        { week: '3~4주차', task: '이랑 만들기·멀칭', detail: '작물 특성에 맞는 이랑 폭과 고랑 설정. 잡초 억제를 위한 멀칭 비닐 피복.', tip: '토양 수분이 적당할 때 이랑을 만들면 흙이 잘 부서져 작업이 수월합니다.' },
      ],
    },
    {
      month: 4, phase: '파종·정식기', phaseColor: '#40916C',
      weeks: [
        { week: '1주차', task: '파종 또는 정식', detail: '적기에 맞춰 직파 또는 이식. 주간·열간 거리를 품종 특성에 맞춰 설정.' },
        { week: '2~3주차', task: '활착 관리', detail: '정식 후 7~10일간 매일 관수. 뿌리 활착 상태 확인. 시들음 발생 시 차광 조치.' },
        { week: '4주차', task: '초기 추비', detail: '활착 확인 후 1차 추비 실시. 질소 과다 주의.', tip: '비료는 "적게 자주"가 원칙입니다. 한 번에 많이 주면 비료 장해가 발생할 수 있습니다.' },
      ],
    },
    {
      month: 5, phase: '생육 초기', phaseColor: '#2D6A4F',
      weeks: [
        { week: '1~2주차', task: '잡초 관리', detail: '멀칭 사이로 올라오는 잡초 수동 제거. 기계 제초 시 작물 뿌리 손상 주의.' },
        { week: '3~4주차', task: '병해충 예찰', detail: '진딧물, 나방류, 곰팡이성 병해 초기 증상 확인. 이병주·이충주 즉시 제거.' },
      ],
    },
    {
      month: 6, phase: '생육 관리기', phaseColor: '#2D6A4F',
      weeks: [
        { week: '1~2주차', task: '2차 추비·관수', detail: '생육 상태에 따라 2차 추비. 가뭄 시 점적관수 실시.' },
        { week: '3~4주차', task: '장마 대비', detail: '배수로 정비 및 토양 과습 방지. 비 온 직후 병해 방제(예방적).', tip: '장마 전 배수로를 깊이 20cm 이상으로 정비하면 침수 피해를 크게 줄일 수 있습니다.' },
      ],
    },
    {
      month: 7, phase: '수확 준비기', phaseColor: '#95D5B2',
      weeks: [
        { week: '1~2주차', task: '성숙도 판단', detail: '작물별 수확 적기 판단 기준(색, 크기, 경도 등) 확인.' },
        { week: '3~4주차', task: '수확 도구 준비', detail: '수확 도구 점검 및 출하 자재(상자, 포장재) 확보.' },
      ],
    },
    {
      month: 8, phase: '수확기', phaseColor: '#CCFF33',
      weeks: [
        { week: '1~2주차', task: '적기 수확', detail: '서늘한 아침 시간에 수확. 수확물은 즉시 그늘진 곳에서 예냉 처리.' },
        { week: '3~4주차', task: '출하·저장', detail: '품질 등급별 선별 후 출하. 저장할 경우 적정 온도·습도 유지.', tip: '수확 직후 1시간 이내에 예냉하면 저장 기간이 1.5~2배 늘어납니다.' },
      ],
    },
    {
      month: 9, phase: '후작 준비', phaseColor: '#B7E4C7',
      weeks: [
        { week: '1~2주차', task: '잔재물 정리', detail: '수확 후 작물 잔재물 제거. 토양에 환원하거나 퇴비화.' },
        { week: '3~4주차', task: '토양 관리', detail: '녹비 작물 파종 또는 토양 소독. 다음 시즌 작부 체계 계획 수립.' },
      ],
    },
  ],
};

export function getCropDetailedPlan(cropName: string): CropDetailedPlan {
  const plan = DETAILED_PLANS[cropName];
  if (plan) return plan;

  // 매핑이 없는 경우 기본 계획에 작물명만 교체
  return { ...DEFAULT_DETAILED_PLAN, cropName };
}
