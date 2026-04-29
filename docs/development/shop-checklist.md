# 🛒 Shop 도메인 — 페이지 개발 체크리스트

> **기준 문서**: `docs/ui-design/mockups/png-mockups/screen-list.md` (S-30 ~ S-36)
> **최종 업데이트**: 2026-04-28

---

## 전체 진행 현황

| 구분 | 완료 | 미완료 | 진행률 |
|:----:|:----:|:-----:|:-----:|
| 프론트 페이지 | 3 | 5 | 38% |
| BFF API Route | 0 | 8 | 0% |
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

### ⬜ S-33. 주문/결제 (`/shop/checkout`) — 미착수

- [ ] `page.tsx` — 결제 UI
- [ ] `page.module.css` — 결제 스타일
- [ ] `useCheckout.ts` — 결제 훅
- [ ] 배송지 입력 폼
- [ ] 주문 상품 확인
- [ ] 결제 수단 선택 (포인트 등)
- [ ] BFF Route Handler (`app/api/shop/order/route.ts`)
- [ ] 백엔드 API (POST `/api/shop/order`)

---

### ⬜ S-35a. 내 상품 목록 — 판매자 (`/mypage/seller`) — 미착수

- [ ] `page.tsx` — 내 등록 상품 목록 UI
- [ ] `page.module.css` — 판매자 목록 스타일
- [ ] `useSellerProducts.ts` — 판매자 목록 훅
- [ ] 상품 상태 관리 (판매중/품절/숨김)
- [ ] 상품 삭제 (판매 중단)
- [ ] BFF Route Handler (`app/api/shop/seller/route.ts`)
- [ ] 백엔드 API (GET/DELETE `/api/shop/seller`)

---

### ⬜ S-35b. 상품 등록 — 판매자 (`/mypage/seller/register`) — 미착수

- [ ] `page.tsx` — 상품 등록 폼 UI
- [ ] `page.module.css` — 등록 폼 스타일
- [ ] `useProductRegister.ts` — 등록 훅
- [ ] 사진 업로드 (최대 5장, 대표 이미지 선택)
- [ ] 카테고리 선택 + 상품명/가격/재고/설명 입력
- [ ] BFF Route Handler (`app/api/shop/seller/route.ts` POST)
- [ ] 백엔드 API (POST `/api/shop/seller`)

---

### ⬜ S-35c. 상품 수정 — 판매자 (`/mypage/seller/[productId]/edit`) — 미착수

- [ ] `page.tsx` — 상품 수정 폼 UI
- [ ] `page.module.css` — 수정 폼 스타일
- [ ] `useProductEdit.ts` — 수정 훅
- [ ] 기존 데이터 프리필 + 이미지 교체
- [ ] BFF Route Handler (`app/api/shop/seller/[id]/route.ts`)
- [ ] 백엔드 API (PATCH `/api/shop/seller/{id}`)

---

### ⬜ S-36. 주문 접수/관리 — 셀러 (`/mypage/seller/orders`) — 미착수

- [ ] `page.tsx` — 셀러 주문 관리 UI
- [ ] `page.module.css` — 셀러 주문 스타일
- [ ] `useSellerOrders.ts` — 셀러 주문 훅
- [ ] 주문 상태 관리 (접수 → 발송 → 완료)
- [ ] 필터 (상태별, 날짜별)
- [ ] BFF Route Handler (`app/api/shop/seller/order/route.ts`)
- [ ] 백엔드 API (GET/PATCH `/api/shop/seller/order`)

---

## 🔄 권장 개발 순서

```
현재 위치
    ↓
③ S-32 장바구니           ← 완료
    ↓
④ S-33 주문/결제          ← 다음 개발 대상
    ↓
⑤ S-35a 판매자 내 상품 목록 (/mypage)
    ↓
⑥ S-35b 상품 등록 (/mypage)
    ↓
⑦ S-35c 상품 수정 (/mypage)
    ↓
⑧ S-36 셀러 주문 관리 (/mypage)
    ↓
⑨ 백엔드 Product CRUD (헥사고날 풀 구현)
    ↓
⑩ BFF Route Handler 연동
```

> [!TIP]
> 다음 페이지는 **S-33 주문/결제**입니다.
> 장바구니에서 선택된 상품 데이터를 결제 페이지로 넘기는 흐름으로 진행합니다.
>
> **S-34(주문 내역)**는 다른 담당자가 별도로 진행합니다.

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
| 6 | **프론트 페이지** | `frontend/app/(main)/shop/` 전체 | 실제 UI에서 필요로 하는 필드 확인 |

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
