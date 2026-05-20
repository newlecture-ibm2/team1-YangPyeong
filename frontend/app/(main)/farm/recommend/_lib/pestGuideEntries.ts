/**
 * 병해충·병해 이름별 상세 가이드 (재배 가이드 카드 pests[] 와 매칭)
 */

export type PestGuideEntry = {
  /** 매칭용 별칭 (부분 일치 포함) */
  aliases: string[];
  kind: '병해' | '해충' | '바이러스' | '생리장해';
  summary: string;
  symptoms: string[];
  prevention: string[];
  control: string[];
  watchPeriod?: string;
};

export const PEST_GUIDE_CATALOG: PestGuideEntry[] = [
  {
    aliases: ['진딧물'],
    kind: '해충',
    summary: '체액을 빨아 식물이 위축되고, 분비물로 곰팡이병(검은색 곰팡)을 유발하며 바이러스 매개충이 됩니다.',
    watchPeriod: '파종 후 2~3주부터 성장기 내내',
    symptoms: [
      '잎 뒷면에 작은 녹·검은 점상 개체 군집',
      '잎이 말리고 끈끈한 담즙(끈적이) 분비',
      '신초 끝이 말리며 생육 둔화',
    ],
    prevention: [
      '은색 반사 멀칭·방충망으로 유입 차단',
      '질소 과다 시비를 피해 연한 잎 유인 억제',
      '천적(날벌레·무당벌레) 서식 환경 조성',
    ],
    control: [
      '초기: 님 오일 500배액 엽면 살포, 3~5일 간격 2~3회',
      '밀도 높을 때: 등록 약제 살포(안전사용기준·마지막 살포일 준수)',
      '바이러스 의심 주변 이병주 즉시 제거',
    ],
  },
  {
    aliases: ['모자이크', '오이모자이크', '오이모자이크바이러스', 'CMV', '모자이크바이러스'],
    kind: '바이러스',
    summary: '모자이크 바이러스군 감염으로 잎에 황록색 반점·무늬가 생기고, 결실·수량이 급감합니다. 진딧물이 주요 매개충입니다.',
    watchPeriod: '생육 전기~수확기',
    symptoms: [
      '잎맥 사이 황록색 모자이크 무늬',
      '잎이 뒤틀리고 심각 시 잎 전체 황화',
      '과실 표면 무늬·변형(작물별 상이)',
    ],
    prevention: [
      '건전 종자·묘 사용, 병든 모본 엄격 차단',
      '진딧물·총채벌레 등 매개충 밀도 관리',
      '손·도구 교차 오염 방지(작업 전후 소독)',
    ],
    control: [
      '감염 확인 즉시 이병주·이과 제거 후 밭 밖 반출',
      '매개충 방제(멀칭·끈끈이 트랩·약제) 병행',
      '치료제가 없으므로 예방·격리가 핵심',
    ],
  },
  {
    aliases: ['무름병', '연부병'],
    kind: '병해',
    summary: '세균성 연부병으로 고온다습 시 줄기·뿌리가 물러지고 악취가 나며 급속 전멸할 수 있습니다.',
    watchPeriod: '장마철·고온다습기',
    symptoms: [
      '줄기·잎柄 부위 수침·연화',
      '병든 조직 갈변·붕괴, 악취',
      '밭 전체가 하루 만에 쓰러지는 경우',
    ],
    prevention: [
      '배수 확보·과습 금지, 이랑 높이기',
      '연작 회피·석회 시용으로 pH 6.0~6.5 유지',
      '종자·도구 소독',
    ],
    control: [
      '초기 발견 즉시 이병주 제거·소독',
      '주변 건전주에 예방 약제 살포',
      '침수 후에는 방제보다 배수·건조 우선',
    ],
  },
  {
    aliases: ['탄저병'],
    kind: '병해',
    summary: '과실·잎에 원형·오목한 갈색 반점이 생기는 진균병으로 습도가 높을 때 확산합니다.',
    watchPeriod: '장마 전후·다습기',
    symptoms: [
      '잎·과실에 갈색 원형 반점(중앙 오목)',
      '심한 경우 낙엽·낙과',
    ],
    prevention: [
      '통풍·배수 확보, 과도한 질소 시비 자제',
      '비 예보 전 예방 살포',
    ],
    control: [
      '발병 초기 등록 약제 살포(간격·희석 준수)',
      '심한 잎·과 제거',
    ],
  },
  {
    aliases: ['역병', '감자역병', '늦은마름병'],
    kind: '병해',
    summary: '토양·공기 전염성이 강한 진균병으로 잎·줄기·뿌리가 검게 마르며 급사할 수 있습니다.',
    watchPeriod: '저온다습·침수 후',
    symptoms: [
      '잎 가장자리부터 갈변·말림',
      '줄기 수침·검은 반점 확대',
      '뿌리 썩음·전체 고사',
    ],
    prevention: [
      '배수로 정비·과습 절대 금지',
      '저항 품종·접목묘 활용(시설·토마토 등)',
      '연작 회피',
    ],
    control: [
      '발견 즉시 이병주 제거',
      '예방·치료 약제 살포, 침수 후 긴급 배수',
    ],
  },
  {
    aliases: ['배추흰나비', '흰나비'],
    kind: '해충',
    summary: '유충이 잎을 갉아 먹어 구멍을 내고, 배추·배추과 채소 피해가 큽니다.',
    watchPeriod: '봄~가을',
    symptoms: ['잎에 불규칙한 구멍', '잎 표면에 녹색 유충', '분변 흔적'],
    prevention: ['방충망·유인트랩 설치', '천적 보호'],
    control: ['유충기 BT제 살포', '성충기 약제·유인제'],
  },
  {
    aliases: ['배추좀나방', '좀나방'],
    kind: '해충',
    summary: '유충이 잎 속을 먹어 배설물로 잎이 말라버리는 현상(배추 속마름 유사)을 일으킵니다.',
    watchPeriod: '봄·가을 성장기',
    symptoms: ['잎 속 굴착 흔적', '배설물로 잎 표면 말림', '심엽 피해'],
    prevention: ['성충기 페로몬 트랩', '잡초·잔재 제거'],
    control: ['유충기 BT제·등록 약제', '심한 포기 제거'],
  },
  {
    aliases: ['배추벌레', '벌레'],
    kind: '해충',
    summary: '성충·유충이 잎을 갉아 먹어 초기 묘기 피해가 큽니다.',
    watchPeriod: '파종 직후~초기 생육',
    symptoms: ['잎 가장자리 갉아먹음', '밭 표면에 성충 활동'],
    prevention: ['멀칭·이랑 정리', '초기 예찰 강화'],
    control: ['유기농: BT제', '밀도 높을 때 약제 살포'],
  },
  {
    aliases: ['담배나방'],
    kind: '해충',
    summary: '유충이 과실·잎을 갉아 상품성을 크게 떨어뜨립니다. 고추·토마토·가지 등에서 중요.',
    watchPeriod: '개화~수확기',
    symptoms: ['과실 구멍·변색', '배설물', '잎말림'],
    prevention: ['페로몬 트랩 예찰', '방충망(시설)'],
    control: ['유충기 BT제', '발생 초기 선택 약제'],
  },
  {
    aliases: ['총채벌레'],
    kind: '해충',
    summary: '잎·꽃을 갉아 먹고 TSWV 등 바이러스를 전파합니다. 시설·노지 채소에서 주의.',
    watchPeriod: '봄~가을',
    symptoms: ['잎 은회색 반점·말림', '꽃·잎 갉아먹음', '바이러스 의심 황화'],
    prevention: ['끈끈이 트랩·방충망', '잡초 제거'],
    control: ['청색 끈끈이 트랩', '바이러스 감염주 제거 후 약제'],
  },
  {
    aliases: ['잿빛곰팡이병', '잿빛곰팡이'],
    kind: '병해',
    summary: '잎 표면에 회색 곰팡 포자가 피복되며 광합성이 저해됩니다. 시설 재배 다습 시 빈발.',
    watchPeriod: '야간 고습·환기 불량 시',
    symptoms: ['잎에 회색 분말状 곰팡', '잎말림·조기 낙엽'],
    prevention: ['환기·습도 관리', '재식 밀도 조절', '하엽 제거'],
    control: ['등록 살균제', '습도 낮추기(환기·난방)'],
  },
  {
    aliases: ['흰가루병'],
    kind: '병해',
    summary: '잎에 백색 가루状 균사가 생기고 잎이 말라갑니다.',
    watchPeriod: '건조·일조 부족 시',
    symptoms: ['잎 양면 백색 분말', '잎 황화·말림'],
    prevention: ['통풍·적정 재식 밀도', '질소 과다 주의'],
    control: ['황·칼리 비료 균형', '살균제 살포'],
  },
  {
    aliases: ['온실가루이', '가루이'],
    kind: '해충',
    summary: '잎 뒷면에서 체액을 빨아 황화·말림을 일으키고 담즙으로 곰팡이를 유발합니다.',
    watchPeriod: '시설 내 건조기',
    symptoms: ['잎 뒷면 흰색 날개 개체', '황화 반점', '검은 곰팡 동반'],
    prevention: ['천적(온실가루이좀벌)', '끈끈이 트랩'],
    control: ['유기: 친환경 약제·비누액', '밀도 높을 때 등록 약제'],
  },
  {
    aliases: ['응애'],
    kind: '해충',
    summary: '잎 뒷면·과실에 거미줄 형태 실이 생기며 점상 황화가 진행됩니다.',
    watchPeriod: '고온 건조기',
    symptoms: ['잎 뒷면 붉은 점상 충', '거미줄状 실', '잎말림'],
    prevention: ['하천수 살포 금지', '습도 60% 이상 유지'],
    control: ['등록 살충제(응애 전용)', '하엽·잡초 제거'],
  },
  {
    aliases: ['검은썩음병'],
    kind: '병해',
    summary: '종자·묘 전염이 많은 병으로 줄기가 검게 썩고 도장状으로 쓰러집니다.',
    watchPeriod: '정식 초기',
    symptoms: ['줄기 기부 검은 썩음', '묘 고사'],
    prevention: ['건전 종자', '온탕 소독·토양 소독'],
    control: ['발병주 제거', '토양 살균·종자 처리'],
  },
  {
    aliases: ['노균병'],
    kind: '병해',
    summary: '잎에 황색·갈색 반점과 곰팡 포자(보라색)가 나타나는 진균병입니다.',
    watchPeriod: '다습·저온기',
    symptoms: ['잎 황화 반점', '잎 뒷면 곰팡'],
    prevention: ['통풍·배수', '잔재 제거'],
    control: ['예방 살균제', '감염 잎 제거'],
  },
  {
    aliases: ['잎마름병'],
    kind: '병해',
    summary: '잎 가장자리부터 갈변·마름이 진행되는 병해군(원인 병원체는 작물별 상이).',
    watchPeriod: '생육 중후기',
    symptoms: ['잎 끝·가장자리부터 갈변', '전체 잎말림'],
    prevention: ['균형 시비·과습 방지'],
    control: ['이병 잎 제거', '살균제·원인별 방제'],
  },
  {
    aliases: ['기생파리'],
    kind: '해충',
    summary: '뿌리·구근을 갉아 내부가 텅 비거나 썩음을 유발합니다.',
    watchPeriod: '저장·성장기',
    symptoms: ['잎 황화·시들음', '뿌리 피해'],
    prevention: ['토양 소독·윤작', '건전 종구'],
    control: ['유충기 토양 처리 약제', '피해 심한 구역 격리'],
  },
  {
    aliases: ['검은무늬병'],
    kind: '병해',
    summary: '잎에 검은색 띠·반점이 생기는 병해로 광합성이 저해됩니다.',
    watchPeriod: '다습기',
    symptoms: ['잎에 검은 띠·반점'],
    prevention: ['통풍·잔재 제거'],
    control: ['살균제', '감염 잎 제거'],
  },
];

function normalizeKey(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase();
}

/** 카드에 표시된 병해충명과 가이드 항목 매칭 */
export function findPestGuideEntry(pestName: string): PestGuideEntry | null {
  const key = normalizeKey(pestName);
  if (!key) return null;

  let best: PestGuideEntry | null = null;
  let bestScore = 0;

  for (const entry of PEST_GUIDE_CATALOG) {
    for (const alias of entry.aliases) {
      const a = normalizeKey(alias);
      if (a === key) return entry;
      if (key.includes(a) || a.includes(key)) {
        const score = a.length;
        if (score > bestScore) {
          bestScore = score;
          best = entry;
        }
      }
    }
  }
  return best;
}

/** 모달·토픽용 문단 배열 생성 */
export function buildPestDetailLines(pestName: string, cropName: string): string[] {
  const entry = findPestGuideEntry(pestName);
  if (!entry) {
    return [
      `【${pestName}】 ${cropName} 재배 시 주의가 필요한 병해충입니다.`,
      `증상: 잎·줄기·과실 이상(반점·말림·구멍 등)을 주 2~3회 예찰하세요.`,
      `예방: 건전 종자·묘, 적정 재식 밀도, 배수·통풍 확보, 질소 과다를 피하세요.`,
      `방제: 초기 발견 시 이병·이충 주 제거 후 등록 약제를 안전사용기준에 따라 살포하세요.`,
      `지역 농업기술센터에 정확한 종정(病名) 확인 후 작물·시기별 권장 약제를 문의하세요.`,
    ];
  }

  const lines: string[] = [
    `【${pestName}】(${entry.kind}) ${entry.summary}`,
  ];
  if (entry.watchPeriod) {
    lines.push(`예찰 시기: ${entry.watchPeriod}`);
  }
  lines.push('증상: ' + entry.symptoms.join(' / '));
  lines.push('예방: ' + entry.prevention.join(' / '));
  lines.push('방제: ' + entry.control.join(' / '));
  return lines;
}
