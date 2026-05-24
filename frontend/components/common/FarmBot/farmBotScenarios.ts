/* ════════════════════════════════════════════════════════
   FarmBot 시나리오 데이터
   페이지별 가이드 스텝을 정의합니다.
   ════════════════════════════════════════════════════════ */

export interface FarmBotStep {
  /** 타겟 요소의 CSS 선택자 */
  target: string;
  /** 말풍선 텍스트 */
  message: string;
  /** 말풍선 위치 */
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface FarmBotScenario {
  /** 적용 페이지 경로 (startsWith 매칭) */
  path: string;
  /** 가이드 스텝 목록 */
  steps: FarmBotStep[];
}

const scenarios: FarmBotScenario[] = [
  /* ──────────────── 랜딩 페이지 ──────────────── */
  {
    path: '/',
    steps: [
      { target: '[data-guide="nav-farm"]', message: '내 농장을 등록하고 관리할 수 있어요! 🌱', position: 'bottom' },
      { target: '[data-guide="nav-shop"]', message: '양평 농산물을 직거래로 사고팔 수 있어요! 🛒', position: 'bottom' },
      { target: '[data-guide="nav-community"]', message: '농업인들과 소통하는 수다방이에요 🗣️', position: 'bottom' },
      { target: '[data-guide="nav-stores"]', message: '우리 동네 농기계, 자재 가게를 찾아보세요 🏡', position: 'bottom' },
      { target: '[data-guide="nav-policy"]', message: '양평군 농업 지원 정책을 한눈에 확인하세요 📜', position: 'bottom' },
    ],
  },

  /* ──────────────── 상점 ──────────────── */
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

  /* ──────────────── 내 농장 ──────────────── */
  /*
   * 비회원·비농업인·농업인 모두 이 시나리오를 공유합니다.
   * useFarmBot이 DOM에 실제 존재하는 타겟만 필터링하므로
   * 각 상태에 맞는 스텝만 자동으로 노출됩니다.
   *
   * 비회원   → nav-farm + farm-guest-login 만 표시
   * 농업인   → nav-farm + farm-farmer-* 만 표시
   */
  {
    path: '/farm',
    steps: [
      // ── 공통 ──
      { target: '[data-guide="nav-farm"]', message: '내 농장을 관리하는 페이지예요 🏡', position: 'bottom' },
      // ── 비회원 전용 — 로그인이 필요한 기능 안내 (GuestPreviewBanner에 연결) ──
      { target: '[data-guide="farm-guest-login"]', message: '로그인하면 내 농장을 직접 등록하고 AI 분석도 받아볼 수 있어요! 지금 바로 시작해보세요 🔑', position: 'top' },
      // ── 농업인 전용 ──
      { target: '[data-guide="farm-farmer-tabs"]', message: '대시보드, 수급 분석, AI 작물 추천, 농장 일지 탭을 이용할 수 있어요! 📑', position: 'bottom' },
      { target: '[data-guide="farm-farmer-kpi"]', message: '농장 면적, 재배 현황, 예상 수익 등 핵심 지표를 한눈에 확인하세요 📈', position: 'bottom' },
      { target: '[data-guide="farm-farmer-insight"]', message: 'AI가 작물별 수확량을 예측하고 수익을 분석해 드려요! KAMIS 도매 시세도 확인 가능해요 🤖', position: 'top' },
      { target: '[data-guide="farm-farmer-recent"]', message: '최근 활동 내역을 기록하고 농장 작업을 체계적으로 관리해보세요 📅', position: 'top' },
      { target: '[data-guide="farm-farmer-info"]', message: '등록된 내 농장의 상세 정보예요. 언제든 수정하거나 관리할 수 있답니다 🌾', position: 'top' },
      { target: '[data-guide="farm-register"]', message: '새로운 재배를 등록하거나 활동 이력을 기록할 수 있어요 📝', position: 'bottom' },
      { target: '[data-guide="farm-list"]', message: '등록한 농장 목록이 여기에 표시돼요. 클릭하면 상세 정보를 확인할 수 있어요 🌾', position: 'top' },
    ],
  },

  /* ──────────────── 수급 현황 ──────────────── */
  {
    path: '/balance',
    steps: [
      { target: '[data-guide="nav-farm"]', message: '양평군 작물의 수급 현황을 한눈에 볼 수 있어요 📊', position: 'bottom' },
      { target: '[data-guide="balance-summary"]', message: '현재 양평군의 전체 수급 요약을 보여줍니다. 과잉/부족 상태를 빠르게 확인하세요 📈', position: 'bottom' },
      { target: '[data-guide="balance-table"]', message: '작물별 상세 수급 데이터예요. 작물을 클릭하면 더 자세한 분석을 볼 수 있어요 🔍', position: 'top' },
    ],
  },

  /* ──────────────── 커뮤니티 ──────────────── */
  {
    path: '/community',
    steps: [
      { target: '[data-guide="nav-community"]', message: '농업인들의 소통 공간이에요! 🗣️', position: 'bottom' },
      { target: '[data-guide="community-search"]', message: '관심 있는 주제의 글을 검색해 보세요 🔍', position: 'bottom' },
      { target: '[data-guide="community-write"]', message: '여기를 눌러 새로운 글을 작성할 수 있어요 ✏️', position: 'bottom' },
      { target: '[data-guide="community-posts"]', message: '다른 농업인들의 경험과 정보가 가득해요. 마음에 드는 글에 댓글도 남겨보세요! 💬', position: 'top' },
    ],
  },

  /* ──────────────── 정책 목록 ──────────────── */
  {
    path: '/policy',
    steps: [
      { target: '[data-guide="nav-policy"]', message: '양평군 농업 지원 정책을 확인하는 페이지예요 📜', position: 'bottom' },
      { target: '[data-guide="policy-filter"]', message: '카테고리별로 원하는 정책을 필터링할 수 있어요 🏷️', position: 'bottom' },
      { target: '[data-guide="policy-list"]', message: '각 정책을 클릭하면 상세 내용과 신청 방법을 확인할 수 있어요! 📋', position: 'top' },
    ],
  },

  /* ──────────────── 주변 가게 ──────────────── */
  {
    path: '/stores',
    steps: [
      { target: '[data-guide="nav-stores"]', message: '주변 농기계·자재 가게를 찾는 페이지예요 🏪', position: 'bottom' },
      { target: '[data-guide="stores-search"]', message: '원하는 가게를 검색하거나 카테고리로 필터링하세요 🔍', position: 'bottom' },
      { target: '[data-guide="stores-map"]', message: '지도에서 가게 위치를 직접 확인할 수 있어요! 📍', position: 'top' },
    ],
  },

  /* ──────────────── 마이페이지 ──────────────── */
  {
    path: '/mypage',
    steps: [
      { target: '[data-guide="mypage-profile"]', message: '프로필 정보를 확인하고 수정할 수 있어요 👤', position: 'bottom' },
      { target: '[data-guide="mypage-tabs"]', message: '알림, 게시글, 댓글, 판매 관리 등 다양한 기능을 탭으로 이동할 수 있어요 📑', position: 'bottom' },
    ],
  },

  /* ──────────────── 판매 상품 관리 ──────────────── */
  {
    path: '/mypage/seller',
    steps: [
      { target: '[data-guide="seller-stats"]', message: '상품의 상태별 개수를 한눈에 볼 수 있어요. 탭을 눌러 필터링도 가능해요! 📊', position: 'bottom' },
      { target: '[data-guide="seller-register"]', message: '새 상품을 등록해보세요! AI가 상품 정보를 자동으로 채워드려요 📦', position: 'bottom' },
      { target: '[data-guide="seller-insight"]', message: 'AI가 판매 데이터를 분석해서 맞춤 인사이트를 제공해요 🤖', position: 'top' },
    ],
  },

  /* ──────────────── 상품 등록 ──────────────── */
  {
    path: '/mypage/seller/register',
    steps: [
      { target: '[data-guide="register-name"]', message: '등록할 상품 이름을 입력하세요. 예: 토마토, 감자 🍅', position: 'bottom' },
      { target: '[data-guide="register-autofill"]', message: 'AI로 전체 채우기를 누르면 카테고리, 가격, 설명이 자동으로 입력돼요! 🤖', position: 'bottom' },
      { target: '[data-guide="register-submit"]', message: '모든 정보를 확인 후 등록 버튼을 눌러주세요 ✅', position: 'top' },
    ],
  },

  /* ──────────────── 판매 주문 관리 ──────────────── */
  {
    path: '/mypage/seller/orders',
    steps: [
      { target: '[data-guide="orders-tabs"]', message: '주문 상태별로 필터링할 수 있어요 (대기/접수/배송 등) 📋', position: 'bottom' },
      { target: '[data-guide="orders-list"]', message: '각 주문을 클릭하면 상세 정보를 확인하고 상태를 변경할 수 있어요 📦', position: 'top' },
    ],
  },

  /* ──────────────── 재배 계획 등록 ──────────────── */
  {
    path: '/farm/seed',
    steps: [
      { target: '[data-guide="seed-farm-select"]', message: '먼저 재배할 농장을 선택하세요 🏡', position: 'bottom' },
      { target: '[data-guide="seed-crop-select"]', message: '심을 작물을 선택하세요. 작물별 예상 수익도 확인 가능해요! 🌱', position: 'bottom' },
      { target: '[data-guide="seed-submit"]', message: '정보를 모두 입력하면 AI가 예상 수익을 분석해 드려요 📊', position: 'top' },
    ],
  },

  /* ──────────────── AI 작물 추천 ──────────────── */
  {
    path: '/farm/recommend',
    steps: [
      { target: '[data-guide="recommend-ranking"]', message: 'AI가 양평군 환경에 맞는 최적의 작물을 추천해 드려요! 🏆', position: 'bottom' },
      { target: '[data-guide="recommend-detail"]', message: '작물을 클릭하면 수익 분석, 재배 난이도 등 상세 정보를 확인할 수 있어요 📈', position: 'top' },
    ],
  },
];

/** 현재 경로에 맞는 시나리오를 반환합니다 */
export function getScenarioForPath(pathname: string): FarmBotScenario | null {
  // 정확한 경로 일치만 허용
  // startsWith는 /mypage/history가 /mypage 시나리오에 잘못 매칭되는 문제 유발
  return scenarios.find((s) => pathname === s.path) || null;
}

export default scenarios;
