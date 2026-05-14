/**
 * 농업인 전환 유도를 위한 미리보기용 더미 데이터
 */

// 1. 농장/토지 관리 더미 데이터
export const DUMMY_FARM = {
  id: 0,
  name: "양평 행복농장 (체험용)",
  address: "경기도 양평군 양평읍 중앙로 1",
  area: 990, // 약 300평
  usableArea: 450,
  soilStatus: {
    ph: 6.5,
    organicMatter: "적정",
    nitrogen: "부족",
    moisture: "22%"
  }
};

// 2. 작물 등록 더미 데이터
export const DUMMY_CULTIVATIONS = [
  { id: 101, cropName: "감자", area: 330, startDate: "2024-03-15", status: "성장중" },
  { id: 102, cropName: "양파", area: 210, startDate: "2024-04-10", status: "파종완료" }
];

// 3. 작물 밸런스 더미 데이터
export const DUMMY_BALANCE = {
  cropName: "감자",
  ratio: 75, // 수급률 (위험)
  status: "부족",
  priceTrend: "상승세",
  recommendation: "현재 양평군 내 감자 공급량이 부족하여 가격이 상승 중입니다. 추가 재배 시 높은 수익이 기대됩니다."
};

// 4. AI 작물 추천 더미 데이터
export const DUMMY_RECOMMENDATIONS = [
  { 
    cropName: "딸기", 
    score: 95, 
    reason: "현재 토양의 유기물 함량이 딸기 재배에 최적이며, 지역 내 수요가 급증하고 있습니다.",
    expectedIncome: "1,200만원 / 100평"
  },
  { 
    cropName: "부추", 
    score: 88, 
    reason: "양평군 전략 작물로 선정되어 지원금 혜택이 크며, 관리가 용이합니다.",
    expectedIncome: "800만원 / 100평"
  }
];

// 5. 정책 매칭 더미 데이터
export const DUMMY_POLICIES = [
  { 
    id: 1, 
    title: "2024 양평군 청년 농업인 영농정착 지원금", 
    amount: "월 110만원", 
    deadline: "2024-12-31" 
  },
  { 
    id: 2, 
    title: "친환경 농자재 구입비 지원 사업", 
    amount: "최대 500만원", 
    deadline: "2024-11-15" 
  }
];
