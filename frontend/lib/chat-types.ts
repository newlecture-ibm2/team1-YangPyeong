/* ════════════════════════════════════════════════════════
   FarmBalance — 챗봇 Action 프로토콜 타입
   AI 서버(ai/app/models/chat.py)의 ChatAction과 1:1 대응
   ════════════════════════════════════════════════════════ */

export type ChatActionType =
  | 'NAVIGATE'
  | 'FILL_FORM'
  | 'TOAST'
  | 'REFRESH'
  | 'CLARIFY'
  | 'CONFIRM'
  | 'OPEN_MODAL'
  | 'PRODUCT_LIST';

/** PRODUCT_LIST 액션에 포함되는 상품 카드 데이터 */
export interface ChatProductItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  /** 1개당 판매 단위 (kg). 기본 1. */
  unitKg?: number;
  salesCount?: number;
  imageUrl?: string;
  categoryName?: string;
}

export type ToastLevel = 'success' | 'info' | 'error';

export type RefreshScope =
  | 'cart'
  | 'orders'
  | 'products'
  | 'seller_products'
  | 'seller_orders';

/** CLARIFY 옵션 한 항목 */
export interface ChatClarifyOption {
  id: string | number;
  label: string;
  meta?: Record<string, unknown>;
}

/** 챗봇이 프론트에 요청하는 단일 액션 */
export interface ChatAction {
  type: ChatActionType;

  /** NAVIGATE */
  url?: string;
  replace?: boolean;
  /** 지연 실행 시간(ms) — NAVIGATE 등 즉시 실행 액션을 지연 후 실행 */
  delay?: number;

  /** FILL_FORM / OPEN_MODAL */
  target?: string;
  payload?: Record<string, unknown>;

  /** TOAST */
  level?: ToastLevel;
  message?: string;

  /** REFRESH */
  scope?: RefreshScope;

  /** CLARIFY / CONFIRM */
  intent?: string;
  question?: string;
  options?: ChatClarifyOption[];

  /** OPEN_MODAL */
  modal?: string;

  /** PRODUCT_LIST — 상품 카드 인라인 렌더링 */
  products?: ChatProductItem[];
}

/** 다중 턴 슬롯 채우기 — 도구가 누락된 인자를 다음 턴에서 받을 수 있게 함 */
export interface PendingIntent {
  tool: string;
  filled: Record<string, unknown>;
  missing: string[];
  prompts: Record<string, string>;
  domain?: string;
}

/** AI 서버 응답 본체 */
export interface ChatReply {
  reply: string;
  actions: ChatAction[];
  pending_intent?: PendingIntent | null;
}
