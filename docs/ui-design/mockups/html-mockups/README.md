# 🌾 FarmBalance HTML Mockups 가이드

이 문서는 FarmBalance 프로젝트의 화면 흐름 검증 및 기획/설계를 위한 **HTML 목업(Mockups)** 디렉토리의 구조와 작성 기준을 설명합니다.
실제 프론트엔드 프레임워크(Next.js) 도입 전 단계에서 화면 간의 빠른 내비게이션, 컴포넌트 배치의 시각화, IA(Information Architecture) 준수 여부를 테스트하기 위한 것입니다.

---

## 1. 개요 및 실행 방법

| 항목 | 내용 |
|------|------|
| **목적** | 기획된 38개 화면의 전체 흐름 확인 및 와이어프레임 톤의 데모 시연 |
| **작성 언어** | Vanilla HTML5 / Vanilla CSS / Vanilla JS (탭 전환 등 최소 인터랙션) |
| **실행 방법** | 브라우저에서 `index.html`을 직접 열기 (별도 서버 불필요) |
| **해상도 기준** | Desktop 1440px 고정 |

---

## 2. 폴더 및 파일 구조

```text
html-mockups/
│
├── index.html                   ← 전체 화면 목록 허브 (38 Screens)
├── README.md                    ← 본 문서
│
├── css/
│   └── style.css                ← 글로벌 디자인 시스템 (토큰, 컬러, 공통 UI)
│
├── components/                  ← 공통 컴포넌트 참조용 (각 페이지에 하드코딩됨)
│   ├── header-user.html         ← 일반/농업인용 GNB
│   ├── header-gov.html          ← 지자체용 GNB
│   └── sidebar-admin.html       ← 관리자용 좌측 사이드바
│
└── pages/                       ← 38개 세부 화면
    ├── landing.html
    ├── auth/
    ├── farm/
    ├── balance/
    ├── recommend/
    ├── policy/
    ├── community/
    ├── shop/
    ├── stores/
    ├── mypage/
    ├── gov/
    └── admin/
```

---

## 3. 도메인별 화면 목록 (총 38개)

### 3.0 랜딩 (1개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 1 | `landing.html` | 랜딩페이지 | `/` | 비회원 초기 진입 화면 |

---

### 3.1 인증 — Auth (3개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 2 | `auth/login.html` | 로그인 | `/auth/login` | 이메일/비밀번호 로그인 |
| 3 | `auth/signup.html` | 회원가입 | `/auth/signup` | 단계별 회원가입 폼 |
| 4 | `auth/password-reset.html` | 비밀번호 찾기 | `/auth/password-reset` | 이메일 기반 비밀번호 재설정 |

---

### 3.2 농장관리 — Farm (3개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 5 | `farm/farm-manage.html` | 농장 관리 | `/farm` | 농장 정보 + 종자등록이력 탭 + AI예측 탭 |
| 6 | `farm/farm-register.html` | 농장 등록 신청 | `/farm/register` | 농장 신규 등록 폼 (3열 그리드, 다중작물 칩) |
| 7 | `farm/seed-register.html` | 종자 구매 등록 | `/farm/seed` | 동적 카드 추가/삭제, 체인 드롭다운 |

---

### 3.3 밸런스 — Balance (2개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 8 | `balance/balance-list.html` | 작물 밸런스 조회 | `/balance` | 전체 작물 수급 현황 목록 |
| 9 | `balance/balance-detail.html` | 작물 밸런스 상세 | `/balance/:cropCode` | 특정 작물 수급 지표 상세 |

---

### 3.4 추천 — Recommend (2개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 10 | `recommend/recommend-list.html` | 추천 목록 | `/recommend` | AI 작물 추천 결과 리스트 |
| 11 | `recommend/recommend-detail.html` | 추천 상세 | `/recommend/:id` | 추천 근거 및 점수 상세 |

---

### 3.5 정책 — Policy (1개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 12 | `policy/policy-list.html` | 정책 목록 | `/policy` | 농업 정책 검색/조회 |

---

### 3.6 커뮤니티 — Community (3개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 13 | `community/community-list.html` | 게시글 목록 | `/community` | 커뮤니티 게시판 목록 |
| 14 | `community/community-detail.html` | 게시글 상세 | `/community/:id` | 게시글 상세 + 댓글 |
| 15 | `community/community-write.html` | 글 작성/수정 | `/community/write` | 게시글 작성 에디터 |

---

### 3.7 상점 — Shop (4개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 16 | `shop/product-browse.html` | 상품 탐색 | `/shop` | 상품 카탈로그 + 필터 |
| 17 | `shop/product-detail.html` | 상품 상세 | `/shop/:id` | 상품 정보 + 구매 |
| 18 | `shop/cart.html` | 장바구니 | `/shop/cart` | 선택 상품 장바구니 |
| 19 | `shop/checkout.html` | 주문/결제 | `/shop/checkout` | 결제 폼 |

---

### 3.8 가게 — Stores (1개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 20 | `stores/store-map.html` | 가게 지도 조회 | `/stores` | 카카오맵 기반 주변 가게 검색 |

---

### 3.9 마이페이지 — MyPage (5개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 21 | `mypage/profile.html` | 프로필 조회/수정 | `/mypage/profile` | 개인정보 관리 |
| 22 | `mypage/orders.html` | 주문 내역 | `/mypage/orders` | 구매 주문 이력 |
| 23 | `mypage/seller-products.html` | 판매 상품 관리 | `/mypage/seller` | 판매자 상품 CRUD |
| 24 | `mypage/seller-orders.html` | 판매 주문 관리 | `/mypage/seller/orders` | 판매자 주문 접수/배송 |
| 25 | `mypage/notifications.html` | 알림 내역 | `/mypage/notifications` | 수급 알림, 시스템 알림 |

---

### 3.10 지자체 — Gov (5개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 26 | `gov/gov-dashboard.html` | 관할 수급 대시보드 | `/gov` | 지자체 메인 대시보드 |
| 27 | `gov/gov-cultivation.html` | 재배 의향 현황 | `/gov/analytics` | 농가 재배 의향 통계 |
| 28 | `gov/gov-compare.html` | 인접 지역 비교 분석 | `/gov/analytics` | 인접 시군 수급 비교 |
| 29 | `gov/gov-sales.html` | 판매 현황 분석 | `/gov/analytics` | 작물별 판매 현황 |
| 30 | `gov/gov-download.html` | 수급 데이터 다운로드 | `/gov/data` | CSV/Excel 데이터 내보내기 |

---

### 3.11 관리자 — Admin (8개)

| # | 파일명 | 화면명 | 라우트 | 설명 |
|---|--------|--------|--------|------|
| 31 | `admin/admin-dashboard.html` | 관리자 대시보드 | `/admin` | 시스템 전체 현황 |
| 32 | `admin/admin-users.html` | 사용자 관리 | `/admin/users` | 회원 목록/검색/상태 관리 |
| 33 | `admin/admin-approvals.html` | 농부 승인/반려 | `/admin/approvals` | 농업인 가입 승인 처리 |
| 34 | `admin/admin-crops.html` | 작물 기준정보 관리 | `/admin/crops` | 작물분류/종자명/단위 기준데이터 CRUD |
| 35 | `admin/admin-data.html` | 외부 데이터 연동 | `/admin/data` | KOSIS/기상청/흙토람 연동 관리 |
| 36 | `admin/admin-engine.html` | 밸런스 엔진 관리 | `/admin/engine` | 수급 엔진 파라미터 설정 |
| 37 | `admin/admin-community.html` | 커뮤니티 관리 | `/admin/community` | 게시글/신고 관리 |
| 38 | `admin/admin-shop.html` | 상점 관리 | `/admin/shop` | 상품 승인/관리 |

---

## 4. 삭제된 화면 (이전 버전 대비)

아래 화면들은 IA 재설계 과정에서 통합 또는 제거되었습니다.

| 화면 | 사유 |
|------|------|
| `farm/plan-register.html` | 파종 계획 등록 — 기능 삭제 |
| `farm/harvest-register.html` | 수확 실적 등록 — 기능 삭제 |
| `mypage/history.html` | 등록 이력 — `farm-manage.html` 탭으로 통합 |
| `mypage/points.html` | 포인트 내역 — 기능 삭제 |
| `policy/policy-detail.html` | 정책 상세 — `policy-list.html`로 통합 |
| `stores/store-detail.html` | 가게 상세 — `store-map.html`로 통합 |
| `shop/orders.html` | 주문 내역 — `mypage/orders.html`로 이동 |
| `shop/seller-products.html` | 판매 상품 관리 — `mypage/seller-products.html`로 이동 |
| `shop/seller-orders.html` | 판매 주문 관리 — `mypage/seller-orders.html`로 이동 |
| `admin/admin-health.html` | 시스템 헬스 — 기능 삭제 |
| `admin/admin-stores.html` | 가게 정보 관리 — 기능 삭제 |
| `admin/admin-coupons.html` | 쿠폰/보상 관리 — 기능 삭제 |

---

## 5. 도메인별 WBS 매핑 요약

FE 개발 시 WBS(작업 분해 구조)에 활용할 수 있는 도메인별 페이지 수와 주요 기능입니다.

| 도메인 | 페이지 수 | 주요 기능 키워드 | 난이도 |
|--------|:---------:|-----------------|:------:|
| **Auth** | 3 | 로그인, 회원가입, 비밀번호 재설정 | ★★☆ |
| **Farm** | 3 | 농장 CRUD, 종자 동적 폼, AI 예측 탭, 다중작물 칩 선택 | ★★★ |
| **Balance** | 2 | 수급 데이터 테이블, 차트 시각화 | ★★★ |
| **Recommend** | 2 | AI 추천 결과, 점수 시각화 | ★★☆ |
| **Policy** | 1 | 정책 검색/필터/상세 조회 | ★☆☆ |
| **Community** | 3 | 게시판 CRUD, 에디터, 댓글 | ★★☆ |
| **Shop** | 4 | 상품 탐색, 장바구니, 결제 플로우 | ★★★ |
| **Stores** | 1 | 카카오맵 API 연동 | ★★☆ |
| **MyPage** | 5 | 프로필, 주문이력, 판매자 관리, 알림 | ★★☆ |
| **Gov** | 5 | 대시보드, 통계 차트, 데이터 다운로드 | ★★★ |
| **Admin** | 8 | 사용자 CRUD, 승인, 기준정보 탭, 엔진 설정 | ★★★ |
| **Landing** | 1 | 비회원 랜딩, CTA, 소개 섹션 | ★☆☆ |
| **합계** | **38** | | |

---

## 6. UI 컴포넌트 및 디자인 토큰

### 6.1 레이아웃 기준

| 항목 | 값 |
|------|-----|
| 해상도 | Desktop 1440px 고정 |
| 일반 페이지 | GNB `header` + `.page` 콘텐츠 영역 |
| 관리자 페이지 | `.sidebar`(220px) + `.admin-main` 우측 영역 |
| 카드 구조 | `.card`, `.grid-2`, `.kpi-row` 등 |

### 6.2 컬러 팔레트

| 변수 | 값 | 용도 |
|------|-----|------|
| `--primary` | `#7c9861` | 올리브 포인트 (버튼, 강조) |
| `--olive-bg` | `#f5f9f0` | 연한 초록 배경 |
| `--green` | `#4cc450` | 안정/정상 배지 |
| `--red` | `#e55353` | 위험/경고/필수 |
| `--orange` | `#ff9800` | 주의 |

---

## 7. 프론트엔드 전환 시 유의사항

1. **라우팅 매핑**: `pages/도메인/파일명` → Next.js `app/(그룹)/도메인/page.tsx`로 1:1 대응
2. **동적 데이터**: 테이블·차트 영역의 더미 데이터를 API 연동으로 교체
3. **컴포넌트 분리**: 현재 하드코딩된 GNB/사이드바를 Layout 컴포넌트로 추출
4. **탭 전환**: 바닐라 JS `data-tab` 방식 → React `useState` 기반 탭 컴포넌트로 전환
5. **폼 동적 기능**: 종자 등록의 카드 추가/삭제, 체인 드롭다운 → React state 관리로 전환
