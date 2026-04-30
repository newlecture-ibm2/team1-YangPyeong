# 🛒 Shop 도메인 — 페이지 개발 체크리스트

> **기준 문서**: `docs/ui-design/mockups/png-mockups/screen-list.md` (S-30 ~ S-36)
> **최종 업데이트**: 2026-04-29

---

## 전체 진행 현황

| 구분 | 완료 | 미완료 | 진행률 |
|:----:|:----:|:-----:|:-----:|
| 프론트 페이지 | 8 | 0 | 100% |
| BFF API Route | 2 | 6 | 25% |
| 백엔드 API | 0 | 8 | 0% |

> **참고**: S-34(주문 내역)는 다른 담당자가 진행합니다.

---

## 📄 페이지별 체크리스트

### ✅ S-30. 상품 탐색 (`/shop`) — 완료

- [x] `page.tsx` — 상품 목록 UI
- [x] `page.module.css` — 목록 스타일
- [x] `useProducts.ts` — 목록 훅 (검색, 카테고리 필터, 정렬)
- [x] `ProductCard.tsx` + `ProductCard.module.css` — 상품 카드 컴포넌트
- [x] `_lib/shop.types.ts` — 공통 타입 정의
- [x] `_lib/shop.api.ts` — 공통 API 함수
- [ ] BFF Route Handler (`app/api/shop/products/route.ts`)
- [ ] 백엔드 연동 (현재 더미 데이터)

---

### ✅ S-31. 상품 상세 (`/shop/[productId]`) — 완료

- [x] `page.tsx` — 상세 UI (이미지 갤러리, 상품 정보, 설명)
- [x] `page.module.css` — 상세 스타일
- [x] `useProductDetail.ts` — 상세 훅
- [x] 다중 이미지 갤러리 (대표 이미지 + 썸네일 + 라이트박스)
- [x] 스크롤 플로팅 바 (장바구니 + 바로구매)
- [x] 구매 모달 (공통 Modal 컴포넌트, center/bottom 지원)
- [x] 카드 높이 정렬 (stretch 레이아웃)
- [x] 바로 구매 → 결제 페이지 이동 (쿼리 파라미터 전달)
- [ ] BFF Route Handler (`app/api/shop/products/[id]/route.ts`)
- [ ] 백엔드 연동 (현재 더미 데이터)

---

### ✅ S-32. 장바구니 (`/shop/cart`) — 완료

- [x] `page.tsx` — 장바구니 UI (2컬럼 레이아웃: 목록 + 주문 요약)
- [x] `page.module.css` — 장바구니 스타일 (반응형 포함)
- [x] `useCart.ts` — 장바구니 훅 (선택/수량/삭제 로직)
- [x] 수량 변경 / 삭제 / 전체 선택·해제
- [x] 주문 금액 요약 + 배송비 계산 + 무료배송 안내
- [ ] BFF Route Handler (`app/api/shop/cart/route.ts`)
- [ ] 백엔드 API (GET/POST/PATCH/DELETE `/api/shop/cart`)

---

### ✅ S-33. 주문/결제 (`/shop/checkout`) — 완료

- [x] `page.tsx` — 결제 UI (2컬럼: 폼 + 주문 요약)
- [x] `page.module.css` — 결제 스타일 (반응형 포함)
- [x] `useCheckout.ts` — 결제 훅
- [x] 배송지 입력 폼 (이름, 연락처, 주소)
- [x] 폼 유효성 검사 (이름 2자 이상, 휴대폰 형식, 주소 필수)
- [x] 연락처 자동 하이픈 포매팅 (`010-1234-5678`)
- [x] 다음(카카오) 우편번호 검색 API 연동
- [x] 배송 메모 (공통 Dropdown 컴포넌트 사용)
- [x] 주문 상품 확인 (장바구니/바로 구매 양쪽 대응)
- [x] 결제 수단 선택 (카드 결제, 무통장 입금)
- [x] 포트원 V2 결제 연동 (`@portone/browser-sdk`)
- [x] 결제 완료 페이지 (`/shop/checkout/complete`)
- [x] BFF Route Handler (`app/api/shop/payment/complete/route.ts`)
- [ ] BFF Route Handler (`app/api/shop/order/route.ts`) — 주문 생성
- [ ] 백엔드 API (POST `/api/shop/order`)
- [ ] 백엔드 연동 (현재 더미 데이터)

---

### ✅ S-35a. 내 상품 목록 — 판매자 (`/mypage/seller`) — 완료

- [x] `page.tsx` — 내 등록 상품 목록 UI
- [x] `page.module.css` — 판매자 목록 스타일
- [x] `useSellerProducts.ts` — 판매자 목록 훅
- [x] 상품 상태 관리 (판매중/품절/숨김)
- [x] 상품 삭제 (판매 중단)
- [ ] BFF Route Handler (`app/api/shop/seller/route.ts`)
- [ ] 백엔드 API (GET/DELETE `/api/shop/seller`)

---

### ✅ S-35b. 상품 등록 — 판매자 (`/mypage/seller/register`) — 완료

- [x] `page.tsx` — 상품 등록 폼 UI
- [x] `page.module.css` — 등록 폼 스타일
- [x] 이미지 업로드 (`uploadFile()` 연동, 최대 5장, 대표 이미지 선택)
- [x] 카테고리 선택 + 상품명/가격/재고/설명 입력
- [x] 유효성 처리 (상품명 200자, 설명 5000자 제한, 가격/재고 숫자만)
- [ ] BFF Route Handler (`app/api/shop/seller/route.ts` POST)
- [ ] 백엔드 API (POST `/api/shop/seller`)

---

### ✅ S-35c. 상품 수정 — 판매자 (`/mypage/seller/[productId]/edit`) — 완료

- [x] `page.tsx` — 상품 수정 폼 UI
- [x] `page.module.css` — 수정 폼 스타일
- [x] 기존 데이터 프리필 + 이미지 교체
- [ ] BFF Route Handler (`app/api/shop/seller/[id]/route.ts`)
- [ ] 백엔드 API (PATCH `/api/shop/seller/{id}`)

---

### ✅ S-36. 주문 접수/관리 — 셀러 (`/mypage/seller/orders`) — 완료

- [x] `page.tsx` — 셀러 주문 관리 UI
- [x] `page.module.css` — 셀러 주문 스타일
- [x] `useSellerOrders.ts` — 셀러 주문 훅
- [x] 주문 상태 관리 (접수 → 발송 → 완료)
- [x] 필터 (상태별 탭 필터)
- [x] KPI 카드 (신규 주문, 배송 준비, 배송중, 이번달 매출)
- [x] 케밥 드롭다운 메뉴 (상세보기, 상태 전환, 거절)
- [x] 행 클릭 상세보기 + 주문 거절 확인 모달
- [ ] BFF Route Handler (`app/api/shop/seller/order/route.ts`)
- [ ] 백엔드 API (GET/PATCH `/api/shop/seller/order`)

---

## 🔄 권장 개발 순서

### 전략: 프론트 전체 완성 → 백엔드 일괄 구현

> [!IMPORTANT]
> 판매자 상품 등록(S-35b)이 **Product 엔티티**를, 주문 관리(S-36)가 **Order 엔티티**의 구조를 확정합니다.
> 프론트 페이지를 먼저 모두 만들어야 필요한 API와 데이터 구조가 완전히 확정되므로,
> **백엔드를 한 번에 설계·구현하여 스키마 변경으로 인한 재작업을 방지**합니다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Phase 1 — 프론트엔드 (페이지 전체 완성) ✅ 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① S-30  상품 탐색            ← 완료 ✅
② S-31  상품 상세            ← 완료 ✅
③ S-32  장바구니             ← 완료 ✅
④ S-33  주문/결제            ← 완료 ✅
⑤ S-35a 판매자 내 상품 목록  ← 완료 ✅
⑥ S-35b 상품 등록           ← 완료 ✅
⑦ S-35c 상품 수정           ← 완료 ✅
⑧ S-36  셀러 주문 관리       ← 완료 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Phase 2 — 백엔드 (일괄 구현) ← 다음 단계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⑨  ERD 설계 (전체 스키마 확정)
    ↓
⑩  Product 도메인 (헥사고날)
    · CRUD + 이미지 업로드
    ↓
⑪  Cart 도메인
    · 장바구니 CRUD
    ↓
⑫  Order 도메인 (헥사고날)
    · 주문 생성 + 상태 관리
    ↓
⑬  BFF Route Handler 연동
    · 프론트 ↔ 백엔드 프록시 연결
```

> [!TIP]
> **Phase 1이 완료되었습니다!** 🎉
> 다음 단계는 **Phase 2 — 백엔드 일괄 구현**입니다.
> ERD 설계부터 시작하여 Product → Cart → Order 순서로 진행합니다.

---

## ⚠️ 백엔드 개발 시 필수 주의사항

> [!CAUTION]
> 백엔드 개발 착수 전 **반드시** 아래 문서를 전부 읽고, DB 스키마 변경이 발생하면 ERD를 **즉시 동기화**해야 합니다.

### 필수 참조 문서 목록

| # | 문서 | 경로 | 참조 이유 |
|:-:|------|------|-----------| 
| 1 | **프로젝트 기획** | `docs/project-spec.md` | 비즈니스 로직, 기능 요구사항 |
| 2 | **ERD** | `docs/architecture/ERD.md` | 테이블 구조, 관계, 컬럼 정의 |
| 3 | **API 스펙** | `docs/architecture/api-spec.md` | 엔드포인트, 요청/응답 형식 |
| 4 | **폴더 구조** | `docs/architecture/folder-structure.md` | 헥사고날 패키지 구조 |
| 5 | **프론트 타입** | `frontend/app/(main)/shop/_lib/shop.types.ts` | 프론트에서 사용 중인 데이터 구조 |
| 6 | **마이페이지 타입** | `frontend/app/(main)/mypage/_lib/mypage.types.ts` | 판매자 관련 데이터 구조 |
| 7 | **프론트 페이지** | `frontend/app/(main)/shop/` + `mypage/seller/` | 실제 UI에서 필요로 하는 필드 확인 |

### ERD 동기화 규칙 (MUST FOLLOW)

```
백엔드 개발 중 DB 스키마 변경 발생
    ↓
┌─────────────────────────────────────────────┐
│  테이블 추가 / 삭제 / 컬럼 변경 시           │
│  docs/architecture/ERD.md를 반드시 함께 수정  │
└─────────────────────────────────────────────┘
    ↓
변경 내용:
  ✅ 테이블 추가 → ERD에 테이블 + 관계 추가
  ✅ 컬럼 추가/삭제 → ERD 해당 테이블 업데이트
  ✅ 관계 변경 → ERD 다이어그램 + 설명 수정
  ✅ 인덱스/제약조건 → ERD에 반영
```

> [!IMPORTANT]
> ERD와 실제 코드가 **불일치하면 안 됩니다.**
> 커밋 시 ERD 변경과 엔티티 코드 변경을 **같은 커밋**에 포함하세요.
