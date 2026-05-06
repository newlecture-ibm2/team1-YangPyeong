/* ════════════════════════════════════════════════════════
   GuideBot 시나리오 데이터
   페이지별 가이드 스텝을 정의합니다.
   ════════════════════════════════════════════════════════ */

export interface GuideStep {
  /** 타겟 요소의 CSS 선택자 */
  target: string;
  /** 말풍선 텍스트 */
  message: string;
  /** 말풍선 위치 */
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface GuideScenario {
  /** 적용 페이지 경로 (startsWith 매칭) */
  path: string;
  /** 가이드 스텝 목록 */
  steps: GuideStep[];
}

const scenarios: GuideScenario[] = [
  {
    path: '/',
    steps: [
      { target: '[data-guide="nav-farm"]', message: '내 농장을 등록하고 관리할 수 있어요! 🌱', position: 'bottom' },
      { target: '[data-guide="nav-balance"]', message: '작물 수급 현황을 한눈에 확인해보세요 📊', position: 'bottom' },
      { target: '[data-guide="nav-recommend"]', message: 'AI가 최적의 작물을 추천해드려요 🤖', position: 'bottom' },
      { target: '[data-guide="nav-shop"]', message: '양평 농산물을 직거래로 구매할 수 있어요! 🛒', position: 'bottom' },
    ],
  },
  {
    path: '/shop',
    steps: [
      { target: '[data-guide="nav-shop"]', message: '양평 직거래 상점에 오신 걸 환영해요! 🎉', position: 'bottom' },
      { target: '[data-guide="cart-btn"]', message: '장바구니에 담은 상품을 여기서 확인할 수 있어요 🛒', position: 'bottom' },
      { target: '[data-guide="shop-category"]', message: '카테고리별로 원하는 농산물을 골라보세요 🌽', position: 'bottom' },
      { target: '[data-guide="shop-search"]', message: '검색과 정렬로 원하는 상품을 빠르게 찾아보세요 🔍', position: 'bottom' },
      { target: '[data-guide="shop-products"]', message: '마음에 드는 상품을 클릭하면 상세 정보를 볼 수 있어요! 📦', position: 'top' },
    ],
  },
  {
    path: '/farm',
    steps: [
      { target: '[data-guide="nav-farm"]', message: '내 농장을 관리하는 페이지예요 🏡', position: 'bottom' },
      { target: '[data-guide="farm-register"]', message: '새로운 작물 재배를 등록해보세요 📝', position: 'bottom' },
      { target: '[data-guide="farm-harvest"]', message: '수확한 작물을 기록할 수 있어요 🌾', position: 'bottom' },
    ],
  },
  {
    path: '/mypage/seller',
    steps: [
      { target: '[data-guide="seller-register"]', message: '새 상품을 등록해보세요! 📦', position: 'bottom' },
      { target: '[data-guide="seller-orders"]', message: '들어온 주문을 관리할 수 있어요 📋', position: 'bottom' },
    ],
  },
  {
    path: '/balance',
    steps: [
      { target: '[data-guide="nav-balance"]', message: '양평군 작물 수급 현황을 분석하는 페이지예요 📈', position: 'bottom' },
    ],
  },
];

/** 현재 경로에 맞는 시나리오를 반환합니다 */
export function getScenarioForPath(pathname: string): GuideScenario | null {
  // 정확히 '/'인 경우 먼저 체크
  if (pathname === '/') {
    return scenarios.find((s) => s.path === '/') || null;
  }
  // 나머지는 startsWith로 매칭 (단, '/' 제외)
  return scenarios.find((s) => s.path !== '/' && pathname.startsWith(s.path)) || null;
}

export default scenarios;
