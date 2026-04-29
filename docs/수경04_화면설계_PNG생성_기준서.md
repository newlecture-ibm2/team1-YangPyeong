# 🌾 Farm Balance — 화면설계 PNG 생성 기준서

> **실무용 화면설계 파일 생성 작업 지시서**
> Version 1.0 | 2026-04-23 | 기준 문서: 수경03_화면목록_IA.md (v2.1)

---

## 문서 목적

이 문서는 기존 `ui-mockups/farm/` 폴더의 **기준 PNG 5종(S10~S14)** 스타일을
Farm Balance 전체 47개 화면으로 일관 확장하기 위한 **실무용 작업 지시서**다.

| 항목 | 내용 |
|------|------|
| **기준 문서** | 수경03_화면목록_IA.md (v2.1) |
| **기준 PNG** | `reference/farm/S10~S14` 5종 |
| **생성 대상** | 47개 화면 (MVP 25 + Phase 2 22) |
| **폴더 구조** | URL 경로 1차 세그먼트 기준 12개 폴더 |
| **파일명 규칙** | 한글 화면명 + `.png` |

---

## 1. 폴더 트리

```
ui-mockups/
│
├── reference/                          ← 기준 PNG 보관 (수정 금지)
│   └── farm/
│       ├── S10_농장등록신청.png
│       ├── S11_농장정보관리.png
│       ├── S12_종자구매등록.png
│       ├── S13_파종계획등록.png
│       └── S14_수확실적등록.png
│
├── 랜딩페이지(비회원).png               ← 최상위 (폴더에 넣지 않음)
│
├── auth/
│   ├── 회원가입.png
│   ├── 로그인.png
│   └── 비밀번호 찾기.png
│
├── farm/
│   ├── 농장 등록 신청.png
│   ├── 농장 관리.png
│   ├── 종자 구매 등록.png
│   ├── 파종 계획 등록.png
│   └── 수확 실적 등록.png
│
├── balance/
│   ├── 작물 밸런스 조회.png
│   └── 작물 밸런스 상세.png
│
├── recommend/
│   ├── AI 작물 추천.png
│   └── 추천 상세.png
│
├── shop/
│   ├── 상품 탐색.png
│   ├── 상품 상세.png
│   ├── 장바구니.png
│   ├── 주문 결제.png
│   ├── 주문 내역.png
│   ├── 상품 등록 관리.png
│   └── 주문 접수 관리(셀러).png
│
├── community/
│   ├── 게시글 목록.png
│   ├── 게시글 상세.png
│   └── 글 작성 수정.png
│
├── policy/
│   └── 정책 매칭 공문 생성.png
│
├── stores/
│   ├── 가게 지도 조회.png
│   └── 가게 상세.png
│
├── mypage/
│   ├── 프로필 조회 수정.png
│   ├── 내 등록 이력.png
│   ├── 포인트 내역.png
│   └── 알림 내역.png
│
├── gov/
│   ├── 관할 수급 대시보드.png
│   ├── 인접 지역 비교 분석.png
│   ├── 재배 의향 현황.png
│   ├── 수급 보고서 생성.png
│   ├── 농가 권고 공지 발송.png
│   └── 수급 데이터 다운로드.png
│
└── admin/
    ├── 관리자 대시보드.png
    ├── 사용자 목록.png
    ├── 농부 승인 반려.png
    ├── 작물 마스터 관리.png
    ├── 외부 데이터 연동.png
    ├── 밸런스 엔진 관리.png
    ├── 시스템 헬스.png
    ├── 커뮤니티 관리.png
    ├── 상점 관리.png
    ├── 가게 정보 관리.png
    └── 쿠폰 보상 관리.png
```

---

## 2. 화면 파일 매핑 표

### 2.1 최상위 · 인증

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-01 | (최상위) | `/` | 랜딩 페이지 | `랜딩페이지(비회원).png` | 전체 | MVP |
| S-02 | auth | `/auth/signup` | 회원가입 | `회원가입.png` | 비회원 | MVP |
| S-03 | auth | `/auth/login` | 로그인 | `로그인.png` | 전체 | MVP |
| S-04 | auth | `/auth/password-reset` | 비밀번호 찾기 | `비밀번호 찾기.png` | 전체 | MVP |

### 2.2 농장 관리

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-10 | farm | `/farm/register` | 농장 등록 신청 | `농장 등록 신청.png` | 일반유저 | MVP |
| S-11 | farm | `/farm` | 농장 정보 관리 | `농장 관리.png` | 일반, 농부 | MVP |
| S-12 | farm | `/farm/seed` | 종자 구매 등록 | `종자 구매 등록.png` | 일반, 농부 | MVP |
| S-13 | farm | `/farm/plan` | 파종 계획 등록 | `파종 계획 등록.png` | 일반, 농부 | MVP |
| S-14 | farm | `/farm/harvest` | 수확 실적 등록 | `수확 실적 등록.png` | 일반, 농부 | Phase 2 |

### 2.3 밸런스 · 추천

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-20 | balance | `/balance` | 작물 밸런스 조회 | `작물 밸런스 조회.png` | 전체 | MVP |
| S-21 | balance | `/balance/:cropCode` | 작물 밸런스 상세 | `작물 밸런스 상세.png` | 전체 | MVP |
| S-22 | recommend | `/recommend` | AI 작물 추천 | `AI 작물 추천.png` | 일반, 농부, 관리자 | MVP |
| S-23 | recommend | `/recommend/:cropCode` | 추천 상세 | `추천 상세.png` | 일반, 농부, 관리자 | MVP |

### 2.4 상점

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-30 | shop | `/shop` | 상품 탐색 | `상품 탐색.png` | 일반, 농부 | Phase 2 |
| S-31 | shop | `/shop/:productId` | 상품 상세 | `상품 상세.png` | 일반, 농부 | Phase 2 |
| S-32 | shop | `/shop/cart` | 장바구니 | `장바구니.png` | 일반, 농부 | Phase 2 |
| S-33 | shop | `/shop/checkout` | 주문/결제 | `주문 결제.png` | 일반, 농부 | Phase 2 |
| S-34 | shop | `/shop/orders` | 주문 내역 | `주문 내역.png` | 일반, 농부 | Phase 2 |
| S-35 | shop | `/shop/seller` | 상품 등록/관리 | `상품 등록 관리.png` | 일반, 농부 | Phase 2 |
| S-36 | shop | `/shop/seller/orders` | 주문 접수/관리 (셀러) | `주문 접수 관리(셀러).png` | 일반, 농부 | Phase 2 |

### 2.5 커뮤니티 · 정책

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-40 | community | `/community` | 게시글 목록 | `게시글 목록.png` | 일반, 농부 | MVP |
| S-41 | community | `/community/:postId` | 게시글 상세 | `게시글 상세.png` | 일반, 농부 | MVP |
| S-42 | community | `/community/write` | 글 작성/수정 | `글 작성 수정.png` | 일반, 농부 | MVP |
| S-44 | policy | `/policy` | 정책 매칭 / 공문 생성 | `정책 매칭 공문 생성.png` | 일반, 농부 | Phase 2 |

### 2.6 가게 · 마이페이지

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-45 | stores | `/stores` | 가게 지도 조회 | `가게 지도 조회.png` | 일반, 농부 | Phase 2 |
| S-46 | stores | `/stores/:storeId` | 가게 상세 | `가게 상세.png` | 일반, 농부 | Phase 2 |
| S-50 | mypage | `/mypage` | 프로필 조회/수정 | `프로필 조회 수정.png` | 로그인 | MVP |
| S-51 | mypage | `/mypage/history` | 내 등록 이력 | `내 등록 이력.png` | 로그인 | MVP |
| S-52 | mypage | `/mypage/points` | 포인트 내역 | `포인트 내역.png` | 로그인 | Phase 2 |
| S-53 | mypage | `/mypage/notifications` | 알림 내역 | `알림 내역.png` | 로그인 | Phase 2 |

### 2.7 지자체

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-60 | gov | `/gov` | 관할 수급 대시보드 | `관할 수급 대시보드.png` | 지자체 | MVP |
| S-61 | gov | `/gov/compare` | 인접 지역 비교 분석 | `인접 지역 비교 분석.png` | 지자체 | Phase 2 |
| S-62 | gov | `/gov/cultivation` | 재배 의향 현황 | `재배 의향 현황.png` | 지자체 | MVP |
| S-63 | gov | `/gov/reports` | 수급 보고서 생성 | `수급 보고서 생성.png` | 지자체 | Phase 2 |
| S-64 | gov | `/gov/notices` | 농가 권고/공지 발송 | `농가 권고 공지 발송.png` | 지자체 | Phase 2 |
| S-65 | gov | `/gov/download` | 수급 데이터 다운로드 | `수급 데이터 다운로드.png` | 지자체 | MVP |

### 2.8 관리자

| 화면 ID | 폴더 | 경로 | 화면명 | 생성 파일명 | 권한 | 비고 |
|---------|------|------|--------|-----------|------|------|
| S-70 | admin | `/admin` | 관리자 대시보드 | `관리자 대시보드.png` | 관리자 | MVP |
| S-71 | admin | `/admin/users` | 사용자 목록 | `사용자 목록.png` | 관리자 | MVP |
| S-72 | admin | `/admin/approvals` | 농부 승인/반려 | `농부 승인 반려.png` | 관리자 | MVP |
| S-73 | admin | `/admin/crops` | 작물 마스터 관리 | `작물 마스터 관리.png` | 관리자 | MVP |
| S-74 | admin | `/admin/data` | 외부 데이터 연동 | `외부 데이터 연동.png` | 관리자 | Phase 2 |
| S-75 | admin | `/admin/engine` | 밸런스 엔진 관리 | `밸런스 엔진 관리.png` | 관리자 | Phase 2 |
| S-76 | admin | `/admin/health` | 시스템 헬스 | `시스템 헬스.png` | 관리자 | Phase 2 |
| S-77 | admin | `/admin/community` | 커뮤니티 관리 | `커뮤니티 관리.png` | 관리자 | MVP |
| S-78 | admin | `/admin/shop` | 상점 관리 | `상점 관리.png` | 관리자 | Phase 2 |
| S-79 | admin | `/admin/stores` | 가게 정보 관리 | `가게 정보 관리.png` | 관리자 | Phase 2 |
| S-80 | admin | `/admin/coupons` | 쿠폰/보상 관리 | `쿠폰 보상 관리.png` | 관리자 | Phase 2 |

---

## 3. 화면별 설계 포인트 요약

### 🏠 최상위

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-01 | 랜딩페이지(비회원) | 비회원 · GNB 포함 · 1단 | 히어로 배너("농업 수급 밸런스 플랫폼") + 기능 소개 카드 3열 + CTA 2개(회원가입/로그인) + 푸터 | S10 GNB + S10 안내 박스 톤 | 히어로 영역, 기능 카드 3개, CTA 버튼 쌍, 푸터 |

### 🔐 auth

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-02 | 회원가입 | 비회원 · 단일 카드 중앙 | 역할 선택 라디오(일반/지자체) → 이메일·비밀번호·이름·전화번호 폼 → SMS 인증 → 가입/취소 버튼. 우측에 💡 역할 안내 박스 | S10 폼 + S10 안내 박스 | 역할 선택 라디오, 입력 폼 5개, SMS 인증 버튼, 안내 박스 |
| S-03 | 로그인 | 비회원 · 단일 카드 중앙 | 이메일+비밀번호 입력 → 로그인 버튼 → "또는" 구분선 → 카카오 로그인 → 하단 링크(비밀번호 찾기, 회원가입) | S10 폼 + 버튼 스타일 | 입력 폼 2개, Primary 버튼, 카카오 버튼, 텍스트 링크 |
| S-04 | 비밀번호 찾기 | 비회원 · 단일 카드 중앙 | 이메일 입력 → "재설정 링크 발송" 버튼 → 성공/실패 메시지 박스 → "로그인으로 돌아가기" 링크 | S10 폼 + S13 경고 박스 톤 | 입력 폼 1개, 발송 버튼, 상태 메시지 박스 |

### 🌾 farm

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-10 | 농장 등록 신청 | 일반 · GNB + 브레드크럼 · 2단(폼+사이드) | 농장명/주소(주소검색)/면적(평 환산)/토양유형(드롭다운)/주요작물(태그칩) + 우측 💡 안내 박스 + 신청/취소 버튼 | **S10 그대로 계승** | 입력 폼, 주소 검색 버튼, 드롭다운, 태그칩, 안내 박스 |
| S-11 | 농장 관리 | 일반 · GNB + 브레드크럼 · 1단 | 농장명 + 승인 상태 배지 + 정보 테이블(주소/면적/토양/등록일) + 수정/삭제 버튼 + 카운트 카드 3개(종자/파종/수확) + 최근 활동 타임라인 | **S11 그대로 계승** | 상태 배지, 정보 테이블, 버튼 쌍, 카운트 카드, 타임라인 |
| S-12 | 종자 구매 등록 | 일반 · GNB + 브레드크럼 · 1단 | 상단 혜택 안내 배너(녹색 점선) + 골드 번호 ①~⑥ 스텝 폼(종자유형 라디오/작물 선택/수량/구매처/구매일/영수증 업로드) + 등록/취소 버튼 | **S12 그대로 계승** | 혜택 배너, 골드 스텝 번호, 라디오, 드롭다운, 파일 업로드, 버튼 |
| S-13 | 파종 계획 등록 | 일반 · GNB + 브레드크럼 · 2단(폼+사이드) | 농장/작물 드롭다운 + 재배 면적(프로그레스 바) + 파종일(달력 위젯) + 목표 수확량 + ⚠️ 면적 초과 경고 + 우측 📊 수급 현황 카드 + 계획등록/취소 버튼 | **S13 그대로 계승** | 드롭다운, 프로그레스 바, 달력, 경고 박스, 수급 카드 |
| S-14 | 수확 실적 등록 | 일반 · GNB + 브레드크럼 · 2단(폼+사이드) · Phase 2 배지 | 연결 파종 계획 정보 바 + 파종 선택 드롭다운 + 실제 수확량(달성률 프로그레스) + 수확일 + 품질등급 라디오(특/상/보통/하) + 비고 텍스트 + 우측 💰 예상 수익 분석 카드 + 실적등록/취소 버튼 | **S14 그대로 계승** | 연결 정보 바, 달성률 바, 품질 라디오, 수익 카드, Phase 2 배지 |

### 📊 balance

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-20 | 작물 밸런스 조회 | 일반 · GNB + 브레드크럼 · 1단 | 필터 바(지역/작물/연도 드롭다운 3개) + 5단계 범례(🔴심각부족~🟣심각과잉) + 작물별 게이지 카드 그리드(4열 × 2~3행, 각 카드: 작물명 + 수평 게이지 + 비율% + 상태 배지) + 페이지네이션 | S13 수급 카드 확장 | 필터 드롭다운 3개, 범례 바, 게이지 카드 8~12개, 페이지네이션 |
| S-21 | 작물 밸런스 상세 | 일반 · GNB + 브레드크럼 · 1단 | 작물 헤더(작물명 + 상태 배지 + 카테고리) + 시계열 라인 차트(공급/수요) + 수치 카드 3개(전년 대비 변화/등록 농가수/평균 가격) + 가격 추이 차트 + 월별 데이터 테이블 | S14 수익 카드 확장 | 헤더 카드, 라인 차트 2개, 수치 카드 3개, 데이터 테이블 |

### 🤖 recommend

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-22 | AI 작물 추천 | 일반 · GNB + 브레드크럼 · 1단 | 사용자 농장 컨텍스트 카드(농장명/토양/면적) + Top 5 추천 카드 리스트(랭킹 배지 + 작물명 + 종합 점수 + 점수 4개 수평 바(수급35%/환경25%/수익25%/역량15%) + 근거 bullet 3개 + "상세 보기" 링크 + "시작하기" CTA) | S12 혜택 배너 + S13 수급 카드 | 컨텍스트 카드, 추천 카드 5개(올리브 좌측 보더), 점수 바, CTA 버튼 |
| S-23 | 추천 상세 | 일반 · GNB + 브레드크럼 · 2단(메인+사이드) | 종합 점수 카드 + 4분면 점수 상세(수급/환경/수익/역량 각각 바 + 기여 요소 리스트) + 예상 수익 시나리오 테이블(보수적/기본/낙관적: 면적/수확량/단가/예상수익) + 재배 가이드 아코디언(파종시기/관리/병해충/수확) + "종자 등록하기" CTA + 우측 수급 상태 카드 | S14 수익 카드 + S13 수급 카드 | 점수 상세 4분면, 시나리오 테이블, 아코디언, 수급 카드, CTA |

### 🛒 shop (전체 Phase 2)

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-30 | 상품 탐색 | 일반 · GNB + 브레드크럼 · 2단(사이드바+메인) · Phase 2 | 좌측 카테고리 필터(전체/채소/과일/곡물/가공/농기구/기타) + 상단 검색바 + 정렬 드롭다운(최신/가격/인기) + 상품 카드 그리드(3열: 이미지/상품명/가격/판매자/평점) + 페이지네이션 | S11 카드 구조 | 카테고리 사이드바, 검색바, 상품 카드 그리드, 페이지네이션 |
| S-31 | 상품 상세 | 일반 · GNB + 브레드크럼 · 2단(이미지+정보) · Phase 2 | 좌측 상품 이미지 영역 + 우측 정보 패널(상품명/가격(굵게)/판매자/재고 상태/수량 선택(+/-)) + "장바구니 담기" 올리브 버튼 + "바로 구매" 갈색 버튼 + 하단 상품 설명 + 판매자 정보 카드 | S14 정보+사이드 카드 | 이미지 영역, 정보 패널, 수량 선택, 버튼 쌍, 판매자 카드 |
| S-32 | 장바구니 | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | 상품 리스트 테이블(체크박스/이미지 썸네일/상품명/단가/수량(+/-)/소계/삭제(X)) + 합계 카드(우측하단) + "선택 삭제" + "주문하기" 버튼. Empty State: 장바구니 아이콘 + "장바구니가 비어있습니다" 메시지 | S11 테이블 구조 | 상품 테이블, 수량 변경, 합계 카드, Empty State |
| S-33 | 주문 결제 | 일반 · GNB + 브레드크럼 · 2단(폼+요약) · Phase 2 | 좌측(넓음): 배송지 폼(수령인/전화/주소검색/상세주소/배송메모) + 결제 수단 라디오(무통장/카드/카카오페이). 우측: 주문 요약 카드(상품명/상품금액/배송비/총 결제금액(굵게)) + "결제하기" 올리브 버튼 | S10 폼 구조 확장 | 배송 폼, 결제 수단 라디오, 주문 요약 카드, 결제 버튼 |
| S-34 | 주문 내역 | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | 필터(기간+상태 드롭다운: 전체/결제완료/배송중/배송완료/취소) + 주문 카드 리스트(주문번호/주문일/상품 썸네일+이름/금액/상태 배지/상세보기 링크) + 페이지네이션. Empty State 포함 | S11 상태 배지 + 리스트 | 필터 드롭다운, 주문 카드, 상태 배지, 페이지네이션, Empty State |
| S-35 | 상품 등록 관리 | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | "새 상품 등록" 버튼 + 등록 폼(상품 사진 업로드/상품명/카테고리/가격/재고/설명 textarea) + 내 상품 목록 테이블(상품명/가격/재고/상태(판매중/품절/승인대기)/수정·삭제 액션) | S12 사진 업로드 + 폼 | 파일 업로드, 입력 폼, 상품 테이블, 상태 배지, 액션 버튼 |
| S-36 | 주문 접수 관리(셀러) | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | 상태 탭(전체/신규/발송준비/배송중/완료) + 주문 테이블(주문번호/주문일/구매자/상품명/수량/금액/상태 배지/액션 드롭다운(접수확인/발송처리/완료처리)) + 확장 상세(배송지) | S11 테이블 + 상태 배지 | 상태 탭, 주문 테이블, 액션 드롭다운, 확장 상세 |

### 💬 community · 📜 policy

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-40 | 게시글 목록 | 일반 · GNB + 브레드크럼 · 1단 | 카테고리 탭(전체/자유/정보공유/Q&A, 올리브 언더라인) + 검색바 + 정렬 드롭다운 + 게시글 리스트(카테고리 배지/제목/작성자/날짜/조회수/댓글수, Q&A는 채택완료 배지) + "글쓰기" FAB 버튼 + 페이지네이션. Empty State 포함 | S11 리스트 구조 | 카테고리 탭, 검색바, 게시글 리스트, 채택 배지, FAB 버튼, Empty State |
| S-41 | 게시글 상세 | 일반 · GNB + 브레드크럼 · 1단 | 게시글 헤더(제목/작성자 아바타+이름/날짜/카테고리 배지/조회수) + 본문 영역(텍스트+이미지) + Q&A인 경우: 답변 섹션(✅ 채택 버튼) + 댓글 섹션(입력 textarea + 댓글 리스트(작성자/날짜/내용/답글)) + 하단 버튼(목록으로/수정/삭제) | S14 정보 표시 구조 | 게시글 헤더, 본문 영역, 답변·채택 시스템, 댓글 입출력 |
| S-42 | 글 작성 수정 | 일반 · GNB + 브레드크럼 · 1단 | 카테고리 드롭다운 + 제목 입력 + 본문 리치 에디터(툴바: 굵기/기울임/리스트/이미지) + 이미지 첨부 업로드 영역(S12 스타일) + 등록/취소 버튼 | S12 폼 + 파일 업로드 | 카테고리 드롭다운, 제목 입력, 에디터, 이미지 업로드, 버튼 |
| S-44 | 정책 매칭 공문 생성 | 일반 · GNB + 브레드크럼 · 2단(입력+결과) · Phase 2 | 좌측: 조건 입력 폼(작물/재배면적/지역/농업경력 + "매칭 검색" 버튼). 우측: 매칭 정책 카드 리스트(정책명/지원기관/지원내용/지원금액/신청기한/상세보기). 하단: 공문 생성 영역(선택 정책 + "공문 템플릿 생성" 버튼 + 미리보기 + PDF 다운로드) | S12 폼 + S10 안내 박스 | 조건 폼, 정책 카드 리스트, 공문 미리보기, 다운로드 버튼 |

### 📍 stores · 👤 mypage

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-45 | 가게 지도 조회 | 일반 · GNB + 브레드크럼 · 2단(지도+리스트) · Phase 2 | 좌측 2/3: 카카오맵 지도 영역(핀 마커). 우측 1/3: 검색바 + 필터(전체/종묘/농약/비료/농기구) + 가게 카드 리스트(가게명/주소/초보 친화도 별점/제휴 배지(올리브)/전화번호). 핀 클릭 시 카드 하이라이트 | S13 좌메인+우사이드 레이아웃 | 지도 영역, 검색·필터, 가게 카드, 제휴 배지 |
| S-46 | 가게 상세 | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | 가게 정보 카드(가게명/주소/전화/영업시간/초보 친화도 별점) + 미니맵 + 리뷰 섹션(전체 평점 + 개별 리뷰 카드(작성자/별점/날짜/내용)) + 취급 상품 리스트/그리드(상품명/카테고리) | S11 정보 테이블 구조 | 가게 정보 카드, 미니맵, 리뷰 카드, 상품 리스트 |
| S-50 | 프로필 조회 수정 | 일반 · GNB + 브레드크럼 · 1단 | 프로필 완성도(%) 프로그레스 바(올리브 채움) + 프로필 아바타("사진 변경" 버튼) + 기본 정보 폼(이름/이메일(읽기전용)/전화/주소) + 토지 정보(농장명/면적/토양유형, 읽기전용 + "농장 관리로 이동" 링크) + 비밀번호 변경 폼(현재/새/확인) + "저장" 버튼 | S13 프로그레스 바 + S10 폼 | 완성도 바, 아바타, 프로필 폼, 비밀번호 폼, 저장 버튼 |
| S-51 | 내 등록 이력 | 일반 · GNB + 브레드크럼 · 1단 | 탭(종자 등록/파종 계획/수확 실적, 올리브 언더라인) + 필터(상태: 전체/등록완료/취소 + 연도) + 이력 테이블(등록일/작물명/수량or면적/상태 배지(등록완료 green/취소 gray)/상세보기) + 페이지네이션 | S11 리스트 + 상태 배지 | 탭 3개, 필터 드롭다운, 이력 테이블, 상태 배지 |
| S-52 | 포인트 내역 | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | 잔액 카드("현재 포인트 잔액: 1,250P", 올리브 강조) + 탭(적립/사용 내역 / 쿠폰 관리) + 내역 테이블(일시/사유/금액(+green/-red)/잔액) + 쿠폰 탭: 쿠폰 카드(코드/할인/유효기간/상태). Empty State 포함 | S11 카운트 카드 + 테이블 | 잔액 카드, 탭, 내역 테이블, 쿠폰 카드, Empty State |
| S-53 | 알림 내역 | 일반 · GNB + 브레드크럼 · 1단 · Phase 2 | 상단 "전체 읽음 처리" 버튼 + 알림 리스트(타입 아이콘(⚠️/📊/🛒/📢)/제목/내용 미리보기/시간/읽음 상태(안읽음=굵게+올리브 좌측 보더)) + 알림 유형: 쏠림 경고, 수급 변동, 주문, 공지, 승인 결과. Empty State 포함 | S11 타임라인 구조 | 전체 읽음 버튼, 알림 리스트, 타입 아이콘, 읽음/안읽음 스타일, Empty State |

### 📈 gov (지자체 전용, GNB 유지 + 지자체 성격 강화)

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-60 | 관할 수급 대시보드 | 지자체 · GNB + 브레드크럼 · 1단 | KPI 카드 4개(과잉 경고(red)/부족 경고(orange)/전체 등록률(%)/전년 대비 변화(↑↓)) + Top10 작물 수급 게이지 바 리스트 + 쏠림 감지 알림 사이드 목록 + YoY 비교 미니 라인 차트 | S11 카운트 카드 확장 + S13 수급 카드 | KPI 카드 4개, 게이지 바 리스트, 쏠림 알림, 라인 차트 |
| S-61 | 인접 지역 비교 분석 | 지자체 · GNB + 브레드크럼 · 1단 · Phase 2 | 기준 지역("양평군") + 비교 지역 멀티셀렉트 드롭다운 + 전국 평균 비교 그룹 바 차트 + 인접 시군구 비교 차트(양평/여주/가평/광주) + 하단 정책 제언 텍스트 영역(AI 분석) | S13 사이드 카드 + 차트 구조 | 지역 선택, 비교 바 차트, 정책 제언 박스 |
| S-62 | 재배 의향 현황 | 지자체 · GNB + 브레드크럼 · 1단 | 3가지 뷰 탭(작물별/지역별/시계열, 올리브 언더라인) + 필터(기간+작물) + 작물별: 수평 스택 바 차트 / 지역별: 읍면 테이블or맵 / 시계열: 월별 라인 차트 | S11 탭 구조 + S13 데이터 카드 | 뷰 탭 3개, 필터, 차트(바/테이블/라인) |
| S-63 | 수급 보고서 생성 | 지자체 · GNB + 브레드크럼 · 1단 · Phase 2 | 보고서 옵션 폼(기간 date range/지역/작물 멀티셀렉트/유형 라디오: 월간/분기/연간) + "보고서 생성" 올리브 버튼(로딩 스피너) + 생성 내역 테이블(보고서명/생성일시/상태(생성중 spinner/완료 ✅)/파일크기/PDF 다운로드). Empty State 포함 | S10 폼 + S11 리스트 | 옵션 폼, 생성 버튼, 내역 테이블, 상태 인디케이터, Empty State |
| S-64 | 농가 권고 공지 발송 | 지자체 · GNB + 브레드크럼 · 1단 · Phase 2 | 대상 지정(지역 읍면 멀티셀렉트/작물 멀티셀렉트/개별 농가 검색 + "선택된 대상: 47명" 배지) + 메시지(제목 input + 내용 textarea) + 채널 체크박스(앱 푸시/SMS) + "발송 미리보기" + "발송하기" 올리브 버튼 + 발송 이력 테이블 | S12 폼 + S10 안내 박스 | 대상 필터, 대상 수 배지, 메시지 입력, 채널 선택, 이력 테이블 |
| S-65 | 수급 데이터 다운로드 | 지자체 · GNB + 브레드크럼 · 1단 | 다운로드 조건 폼(기간 date range/지역/작물 멀티셀렉트/데이터 항목 체크박스(수급량/가격/등록현황/의향데이터)/파일 형식 라디오(CSV/XLSX)) + "미리보기" → 미리보기 테이블(5행 샘플) + "다운로드" 올리브 버튼 + 💡 안내("최대 10,000건") | S10 폼 + S11 테이블 | 조건 폼, 체크박스, 라디오, 미리보기 테이블, 다운로드 버튼, 안내 박스 |

### ⚙️ admin (관리자 전용, 좌측 사이드바 필수)

| ID | 화면명 | 레이아웃 유형 | 설계 구조 | 참고 기준 PNG | 핵심 UI 블록 |
|----|--------|-------------|----------|-------------|------------|
| S-70 | 관리자 대시보드 | 관리자 · 좌측 사이드바 | KPI 카드 4개(가입 승인 대기(alert 배지)/오늘 등록 건수/주간 종자 구매량/로스율(%)) + 일별 가입 추이 라인 차트 + 작물별 선호도 파이 차트 + 외부 API 상태(기상청/KAMIS/농산물유통: 🟢정상/🔴장애 + 마지막 동기화 시간) | S11 카운트 카드 확장 | 사이드바, KPI 카드, 라인 차트, 파이 차트, API 상태 리스트 |
| S-71 | 사용자 목록 | 관리자 · 좌측 사이드바 | 검색바 + 필터 드롭다운(역할: 전체/일반/농부/지자체/관리자, 상태: 전체/활성/정지) + 사용자 테이블(이름/이메일/역할 배지/가입일/상태 배지(활성 green/정지 red)/액션(역할 변경 드롭다운/정지 토글/감사로그 링크)) + 페이지네이션 + 총 건수 | S11 테이블 + 상태 배지 | 사이드바, 검색·필터, 사용자 테이블, 역할·상태 배지, 액션 |
| S-72 | 농부 승인 반려 | 관리자 · 좌측 사이드바 | 상태 탭(대기중/승인완료/반려) + 대기 목록 테이블(신청자명/농장명/면적/토양유형/신청일/액션) + 확장 상세(주소/주요작물 등 농장 전체 정보) + 승인 올리브 버튼 + 반려 red 버튼 + 반려 시 사유 textarea 모달 | S10 안내 박스 + S11 상태 배지 | 사이드바, 상태 탭, 대기 테이블, 확장 상세, 승인/반려 버튼, 반려 사유 |
| S-73 | 작물 마스터 관리 | 관리자 · 좌측 사이드바 | "작물 등록" 올리브 버튼 + 작물 테이블(작물코드/작물명/카테고리/시즌/상태 토글(활성/비활성)/수정 액션) + 등록·수정 모달(작물명/카테고리/시즌 멀티/단위수확량) + "밸런스 재계산" 주황 버튼(리프레시 아이콘) + 💡 안내("재계산은 전체 수급 데이터에 영향") | S11 테이블 + S10 폼 | 사이드바, 작물 테이블, 상태 토글, 모달 폼, 재계산 버튼, 안내 |
| S-74 | 외부 데이터 연동 | 관리자 · 좌측 사이드바 · Phase 2 | 데이터 소스 테이블(API명(기상청/KAMIS/농산물유통)/상태 인디케이터(🟢/🔴)/갱신 주기 드롭다운(1h/6h/24h)/마지막 갱신 datetime/설정·수동갱신 액션) + 설정 확장 패널(URL/API Key(마스킹)/timeout/retry) + 이상값 탐지 로그 테이블(일시/소스/항목/탐지값/기준값/상태) + RAG 설정 서브섹션 | S11 테이블 + 상태 인디케이터 | 사이드바, 소스 테이블, 상태 인디케이터, 설정 패널, 이상값 로그 |
| S-75 | 밸런스 엔진 관리 | 관리자 · 좌측 사이드바 · Phase 2 | 현재 설정값 카드(활성 임계치/가중치/주기) + 설정 폼: 임계치 슬라이더(부족 경계%/과잉 경계%/쏠림 경계%) + 가중치 슬라이더(수급35/환경25/수익25/역량15, 합계=100%) + 계산 주기 드롭다운(5분/15분/1시간/수동) + "Hot Reload" 주황 버튼 + "저장" 올리브 + "초기화" 회색 + 변경 이력 테이블(일시/변경자/항목/이전값/변경값) | S13 프로그레스 바 + S10 폼 | 사이드바, 설정 카드, 슬라이더, 주기 드롭다운, Hot Reload, 이력 테이블 |
| S-76 | 시스템 헬스 | 관리자 · 좌측 사이드바 · Phase 2 | 구성요소 상태 카드 4개(DB PostgreSQL/API Spring Boot/Cache Redis/Queue: 각각 🟢/🟡/🔴 + uptime + 응답시간) + API 응답시간 히트맵(행=엔드포인트, 열=시간, 24시간) + 요청수/응답시간/에러율 라인 차트 + 최근 에러 로그 테이블(일시/endpoint/status code/에러메시지/count) | S11 카드 구조 + 상태 인디케이터 | 사이드바, 상태 카드 4개, 히트맵, 라인 차트, 에러 로그 테이블 |
| S-77 | 커뮤니티 관리 | 관리자 · 좌측 사이드바 | 검색바 + 필터(카테고리/상태(전체/게시중/삭제됨/신고접수)/기간) + 게시글 테이블(게시글ID/제목/작성자/카테고리/작성일/조회수/신고수(red if >0)/상태 배지/액션) + 액션: "삭제" red + "공지 지정" 올리브 + "신고 처리" 주황 + 신고 처리 모달(신고 내역 리스트 + 처리 라디오(경고/삭제/무시) + "처리" 버튼). Empty State 포함 | S11 테이블 + 상태 배지 | 사이드바, 검색·필터, 게시글 테이블, 액션 버튼, 신고 모달, Empty State |
| S-78 | 상점 관리 | 관리자 · 좌측 사이드바 · Phase 2 | 탭(상품 관리/분쟁 처리) + 상품 탭: 테이블(상품명/판매자/카테고리/가격/등록일/상태(판매중/승인대기/비활성화)/승인·반려·비활성화 액션) + 분쟁 탭: 분쟁 테이블(분쟁번호/구매자/판매자/상품/사유/접수일/상태(접수/처리중/완료)/처리 액션). Empty State 포함 | S11 테이블 구조 | 사이드바, 탭, 상품 테이블, 분쟁 테이블, 상태 배지, Empty State |
| S-79 | 가게 정보 관리 | 관리자 · 좌측 사이드바 · Phase 2 | "가게 등록" 올리브 버튼 + 가게 테이블(가게명/주소/카테고리/상태(활성/비활성)/제휴 토글(✅/❌)/등록일/수정·삭제 액션) + 편집 모달(가게명/주소/전화/영업시간/카테고리/취급상품 태그/제휴 토글). Empty State 포함 | S11 테이블 + S10 폼 | 사이드바, 가게 테이블, 제휴 토글, 편집 모달, Empty State |
| S-80 | 쿠폰 보상 관리 | 관리자 · 좌측 사이드바 · Phase 2 | 탭(쿠폰 관리/포인트 정책) + 쿠폰 탭: "쿠폰 발급" 버튼 + 쿠폰 테이블(코드/유형(정액/정률)/할인/유효기간/대상(전체/농부/특정)/발급수/사용수/상태/수정·비활성화) + 발급 폼(유형/할인값/기간/대상/수량) + 포인트 정책 탭: 정책 카드(종자등록 100P/영수증 50P/파종등록 30P, 각각 enable/disable 토글 + 금액 input) + "정책 저장" 버튼 | S11 테이블 + S10 폼 | 사이드바, 탭, 쿠폰 테이블, 발급 폼, 포인트 정책 카드, 토글 |

---

## 4. 도메인별 이미지 생성 프롬프트

### 🎨 공통 스타일 프리픽스

모든 프롬프트 앞에 반드시 아래를 붙인다.

```
[공통] Desktop 1440px wireframe for "FarmBalance" agricultural platform.
Olive green (#4A7C59) primary, beige/ivory background, brown (#8B7355) accent.
White cards with subtle gray borders, rounded corners.
Buttons: Primary=olive bg+white text, Secondary=gray, Danger=red outline.
Korean text. Clean wireframe/screen design document style, not final UI.
```

비회원/auth 화면은 추가로:
```
[AUTH] No breadcrumb. Center-aligned single card form layout.
Minimal, clean. FarmBalance logo at top center.
```

일반유저/농부 화면은 추가로:
```
[USER] Top GNB: 🌿 FarmBalance logo left, menu center (홈/농장관리/밸런스/추천/커뮤니티/상점),
bell+avatar right. Breadcrumb below GNB. No left sidebar.
```

지자체 화면은 추가로:
```
[GOV] Top GNB same as user. Breadcrumb. No left sidebar.
Government analytics/administration feel. KPI-heavy, chart-focused.
```

관리자 화면은 추가로:
```
[ADMIN] Left sidebar navigation with icons: 대시보드/사용자관리/농부승인/작물마스터/
데이터연동/밸런스엔진/시스템헬스/커뮤니티관리/상점관리/가게관리/쿠폰관리.
Active item highlighted in olive. No top menu items — logo only in top-left.
Table/filter/action-centric admin UI. Not SaaS style.
```

Phase 2 화면은 추가로:
```
[P2] Dark brown pill badge "Phase 2" at top-right corner.
```

---

### 📁 최상위

**랜딩페이지(비회원).png**
```
[공통]
Screen: 랜딩페이지(비회원). Path: /
Top: GNB with FarmBalance logo + simplified menu (로그인/회원가입 right side only).
Hero section: large heading "🌾 농업 수급 밸런스 플랫폼" with sub-copy about connecting
farmers with balanced crop supply-demand data. Two CTA buttons side by side:
"회원가입" olive button + "로그인" gray outline button.
Below hero: 3 feature cards in a row on ivory background:
(1) 📊 작물 밸런스 — "지역 작물 수급 현황을 한눈에" with gauge icon,
(2) 🤖 AI 추천 — "내 농장에 맞는 최적 작물 추천" with sparkle icon,
(3) 💬 커뮤니티 — "농업인 정보 공유 커뮤니티" with chat icon.
Each card: icon top, title bold, 1-line description below.
Footer: © FarmBalance, 이용약관, 개인정보처리방침 links.
```

---

### 📁 auth/

**회원가입.png**
```
[공통][AUTH]
Screen: 회원가입. Path: /auth/signup
Center card. Title: "🌱 회원가입".
Role selection section with two card-style radio options:
"일반 사용자" (person icon) and "지자체 사용자" (building icon).
Form fields below: 이메일, 비밀번호, 비밀번호 확인, 이름, 전화번호.
Phone field has inline "인증번호 발송" olive button, then 인증번호 input + "확인" button.
Right side: 💡 안내 box (beige background): "일반 사용자는 농장 등록 후 농부로 전환 가능합니다."
with 3 bullet items about role differences.
Bottom: "가입하기" olive button + "취소" gray button.
```

**로그인.png**
```
[공통][AUTH]
Screen: 로그인. Path: /auth/login
Center card, compact. Title: "🌱 로그인".
이메일 input (placeholder "이메일을 입력하세요"), 비밀번호 input (placeholder "비밀번호를 입력하세요").
"로그인" full-width olive button.
Divider "── 또는 ──".
Kakao login button (#FEE500 yellow bg, kakao bubble icon, "카카오로 시작하기" text).
Bottom: two text links "비밀번호를 잊으셨나요?" and "회원가입" separated by ·.
```

**비밀번호 찾기.png**
```
[공통][AUTH]
Screen: 비밀번호 찾기. Path: /auth/password-reset
Center card. Title: "🌱 비밀번호 찾기".
Subtitle: "가입 시 사용한 이메일을 입력해주세요."
이메일 input field.
"재설정 링크 발송" olive button.
Below: two state variations shown:
(1) ✅ Success box (light green bg): "재설정 링크가 이메일로 발송되었습니다."
(2) ⚠️ Error box (light yellow bg): "등록되지 않은 이메일입니다."
Bottom link: "로그인으로 돌아가기".
```

---

### 📁 farm/

**농장 등록 신청.png**
```
[공통][USER]
Screen: 농장 등록 신청. Path: /farm/register
Breadcrumb: 농장관리 > 농장 등록.
Title: "🌱 농장 등록 신청", subtitle: "농장 정보를 입력하면 관리자 승인 후 농부 회원으로 전환됩니다".
Form: 농장명 (text, placeholder "예: 양평 해맑은 농장"),
주소 (text + "주소 검색" dark button), 면적 (number + m², helper "평 환산: 000평"),
토양 유형 (dropdown expanded showing 사양토/양토/식양토/식토),
주요 재배 작물 (tag chips: 사양토× 식양토×).
Right panel: 💡 안내 box (beige bg) with 3 bullets about admin approval process.
Bottom: "신청하기" olive button + "취소" gray button.
Reference: Match S10_농장등록신청.png exactly in tone, spacing, form style, and info box.
```

**농장 관리.png**
```
[공통][USER]
Screen: 농장 관리. Path: /farm
Breadcrumb: 농장관리 > 내 농장. Browser chrome on top with "Browser View 1440px".
Title: "🏠 내 농장 관리".
Farm name "양평 해맑은 농장" with badges: ✅ 승인완료 (green) + ⏳ 승인대기 (gray).
Info table: 주소(경기도 양평군 용문면)/면적(3,300m² 1,000평)/토양유형(양토)/등록일(2026-03-15).
Two buttons: "수정하기" olive outline + "농장 삭제" red outline.
Three count cards row: 등록된 종자 5건 (seed icon🌰), 파종 계획 3건 (sprout icon🌱), 수확 실적 2건 (basket icon🧺).
Section: "최근 활동 기일전보" — timeline with green dots, Korean dates, activity descriptions.
Reference: Match S11_농장정보관리.png exactly.
```

**종자 구매 등록.png**
```
[공통][USER]
Screen: 종자 구매 등록. Path: /farm/seed
Breadcrumb: 농장관리 > 종자 등록. Width annotation "1440px" above frame.
Title: "🌱 종자 구매 등록".
Top banner (green dashed border): "🌱 심은 작물을 등록하면 이런 정보를 드려요!"
with 4 ✅ items (정책 분석, AI공문, 수급 리포트, 재배 현황).
Numbered steps with gold circle ①~⑥:
① 종자 유형 (radio: 씨앗/종자/모종),
② 작물 선택 (searchable dropdown), ③ 수량 (number + 개/kg/포),
④ 구매처 (text "구매한 가게명"), ⑤ 구매일 (datepicker calendar icon),
⑥ 영수증 사진 (upload zone: camera icon + "사진을 끌어놓거나 클릭하세요").
Bottom: "등록하기" olive button + "취소" gray button.
Reference: Match S12_종자구매등록.png exactly.
```

**파종 계획 등록.png**
```
[공통][USER]
Screen: 파종 계획 등록. Path: /farm/plan
Breadcrumb: 농장관리 > 파종 계획. "Desktop 1440px" label top-left.
Title: "🌱 파종 계획 등록".
농장 선택 dropdown "양평 해맑은 농장 (3,300m²)".
작물 선택 dropdown + helper "최근 시즌의 작물 작물 선택".
재배 면적 number input m² + blue progress bar "농장 면적의 45% 사용 중 (1,485/3,300m²)".
파종 예정일 "4월" dropdown → expanded calendar April 2026, 28 highlighted.
목표 수확량 input kg, helper "이 작물 평균 단위수확량: 3.2kg/m² → 추천 목표: 약 580kg".
⚠️ Yellow warning box: "입력한 면적이 농장 잔여 면적을 초과합니다. 확인해주세요."
Right card: "📊 현재 이 작물 수급 현황" — ● 적정 (95%), 양평군 재배 농가: 47호, 전년 대비: +12%.
Bottom: "계획 등록" olive button + "취소" gray button.
Reference: Match S13_파종계획등록.png exactly.
```

**수확 실적 등록.png**
```
[공통][USER][P2]
Screen: 수확 실적 등록. Path: /farm/harvest
Breadcrumb: 농장관리 > 수확 실적. "Desktop view 1440px" top-left.
Title: "🌱 수확 실적 등록". Phase 2 badge top-right.
Top info bar: "📋 연결된 파종 계획" — 작물: 고추, 면적: 1,200m², 파종일: 2026-04-15, 목표수확량: 3,840kg.
파종 계획 선택 dropdown: "고추 - 2026-04-15 파종 (1,200m²)".
실제 수확량 input kg + brown progress bar "목표 대비 달성률: 87% (3,340/3,840kg)".
수확일 datepicker 2026-04-15.
품질 등급 radio: ◉ 특(★★★) ○ 상(★★) ○ 보통(★) ○ 하(☆).
비고 textarea "수확 관련 메모를 남겨주세요".
Right card: "💰 예상 수익 분석" — 현재 시세: 4,200원/kg, 예상 수익: 약 1,403만원, 수급 상태: 🟢 적정.
Bottom: "실적 등록" olive button + "취소" gray button.
Reference: Match S14_수확실적등록.png exactly.
```

---

### 📁 balance/

**작물 밸런스 조회.png**
```
[공통][USER]
Screen: 작물 밸런스 조회. Path: /balance
Breadcrumb: 밸런스 > 수급 조회.
Title: "📊 작물 밸런스 조회".
Filter bar: 3 dropdowns — 지역(양평군), 작물 카테고리(전체), 연도(2026).
Legend: 5 colored dots with labels — 🔴 심각 부족 / 🟠 부족 / 🟢 적정 / 🔵 과잉 / 🟣 심각 과잉.
Grid of 8 crop gauge cards (4×2). Each card: white bg, subtle border, rounded corners.
Inside card: crop name Korean (고추/배추/감자/토마토/당근/양파/딸기/옥수수),
horizontal gauge bar colored by status, percentage (e.g., 95%), small status badge.
Bottom: pagination. Same card style as S13 side info card.
```

**작물 밸런스 상세.png**
```
[공통][USER]
Screen: 작물 밸런스 상세. Path: /balance/:cropCode
Breadcrumb: 밸런스 > 고추.
Title: "📊 고추 수급 밸런스 상세".
Header card: crop name, 🟢 적정 (95%) badge, category "채소", season "봄/여름".
Line chart: "수급 추이" — two lines (공급/수요) over 12 months, olive+brown colors.
Three metric cards row: 전년 대비 +12%↑ / 등록 농가 47호 / 평균 가격 4,200원/kg.
Second chart: "가격 추이" bar chart over recent 6 months.
Data table: columns 월/공급량/수요량/비율(%)/상태배지.
Same visual density as S14 side card expanded to full width.
```

---

### 📁 recommend/

**AI 작물 추천.png**
```
[공통][USER]
Screen: AI 작물 추천. Path: /recommend
Breadcrumb: 추천 > AI 추천.
Title: "🤖 AI 작물 추천" with "(Powered by Gemini)" subtitle.
Context card: "양평 해맑은 농장 · 양토 · 3,300m²" beige background.
5 recommendation cards stacked vertically:
Each card: rank circle (#1~#5), crop name bold, overall score number,
4 horizontal score bars (수급 olive / 환경 green / 수익 brown / 역량 blue)
with percentage labels, 3 근거 bullets in small text,
"상세 보기" link + "이 작물로 시작하기" olive CTA button.
Cards have white bg, subtle olive left border. Style similar to S12 benefit banner cards.
```

**추천 상세.png**
```
[공통][USER]
Screen: 추천 상세. Path: /recommend/:cropCode
Breadcrumb: 추천 > 고추 상세.
Title: "🤖 고추 — AI 추천 상세 분석".
Score card: large overall score + badge.
4-quadrant section: 수급적합도/환경적합도/수익성/역량적합도 — each with score bar,
contributing factors bullet list, mini explanation.
Table: 예상 수익 시나리오 — 3 rows (보수적/기본/낙관적) × columns (면적/수확량/단가/예상수익).
Accordion section: 재배 가이드 — 파종시기/관리요령/병해충/수확시기 expandable blocks.
Bottom: "이 작물로 종자 등록하기" olive CTA linking to /farm/seed.
Right sidebar: 수급 상태 card same as S13 side card.
```

---

### 📁 shop/ (모두 Phase 2)

**상품 탐색.png**
```
[공통][USER][P2]
Screen: 상품 탐색. Path: /shop
Breadcrumb: 상점 > 상품 탐색.
Title: "🛒 상품 탐색".
Left filter sidebar: category list (전체 bold, 채소/과일/곡물/가공식품/농기구/기타).
Top: search bar placeholder "상품명을 검색하세요" + sort dropdown (최신순/가격순/인기순).
Main: product card grid 3×2. Each card: image placeholder, 상품명, 가격 (원), 판매자, rating stars.
Same card style as S11 count cards but for products.
Bottom: pagination numbers.
```

**상품 상세.png**
```
[공통][USER][P2]
Screen: 상품 상세. Path: /shop/:productId
Breadcrumb: 상점 > 상품 상세.
Left: large product image placeholder area.
Right info panel: 상품명 bold, 가격 large bold, 판매자 with link, 재고 "판매중",
수량 selector (+/-), "장바구니 담기" olive button + "바로 구매" brown button.
Below: 상품 설명 text area.
Seller card: 판매자명/농장명/평점/가입일. Same layout as S14 main+side card.
```

**장바구니.png**
```
[공통][USER][P2]
Screen: 장바구니. Path: /shop/cart
Breadcrumb: 상점 > 장바구니.
Title: "🛒 장바구니".
Table: ☐ checkbox / thumbnail / 상품명 / 단가 / 수량 (+/-) / 소계 / X delete.
Right-bottom: total card (상품합계/배송비/총 금액 bold).
"선택 삭제" gray button + "주문하기" olive button.
Empty State: cart icon + "장바구니가 비어있습니다" + "상품 탐색하기" link.
Table style matches S11 info table.
```

**주문 결제.png**
```
[공통][USER][P2]
Screen: 주문 결제. Path: /shop/checkout
Breadcrumb: 상점 > 주문/결제.
Title: "🛒 주문/결제".
Left (wider): 배송지 정보 form — 수령인/전화번호/주소(+주소검색 button)/상세주소/배송메모.
Payment: radio 무통장입금/카드결제/카카오페이.
Right: 주문 요약 card — item list mini/상품금액/배송비/총 결제금액 bold red.
"결제하기" large olive button. Form style matches S10.
```

**주문 내역.png**
```
[공통][USER][P2]
Screen: 주문 내역. Path: /shop/orders
Breadcrumb: 상점 > 주문 내역.
Title: "🛒 주문 내역".
Filters: date range + status (전체/결제완료/배송중/배송완료/취소).
Order cards: 주문번호/주문일/thumbnail+상품명/금액/status badge (결제완료 blue/배송중 olive/
배송완료 green/취소 gray). "상세보기" link each.
Pagination. Empty State: box icon + "주문 내역이 없습니다."
```

**상품 등록 관리.png**
```
[공통][USER][P2]
Screen: 상품 등록 관리. Path: /shop/seller
Breadcrumb: 상점 > 상품 관리 (판매자).
Title: "🛒 상품 등록/관리".
"새 상품 등록" olive button top-right.
Registration form: photo upload zone (camera, drag-drop, S12 style),
상품명/카테고리 dropdown/가격 input/재고 input/설명 textarea.
Below: 내 상품 목록 table — 상품명/가격/재고/상태badge(판매중green/품절red/승인대기yellow)/
수정·삭제 action links.
```

**주문 접수 관리(셀러).png**
```
[공통][USER][P2]
Screen: 주문 접수 관리(셀러). Path: /shop/seller/orders
Breadcrumb: 상점 > 판매 주문 관리.
Title: "🛒 주문 접수/관리".
Status tabs: 전체|신규주문|발송준비|배송중|완료 (olive underline).
Order table: 주문번호/주문일/구매자/상품명/수량/금액/status badge/
action dropdown (접수확인/발송처리/완료처리).
Expandable row detail with 배송지 info. Same table style as S11.
```

---

### 📁 community/

**게시글 목록.png**
```
[공통][USER]
Screen: 게시글 목록. Path: /community
Breadcrumb: 커뮤니티 > 게시글.
Title: "💬 커뮤니티".
Category tabs: 전체 | 자유게시판 | 정보공유 | Q&A (olive underline active).
Search bar + sort dropdown (최신순/조회순/댓글순).
Post list rows: [카테고리badge] 제목 / 작성자 / 날짜 / 조회수 / 댓글수.
Q&A posts: 채택완료 green badge.
Bottom-right: "글쓰기" olive FAB button.
Pagination. Empty State: speech icon + "아직 게시글이 없습니다."
```

**게시글 상세.png**
```
[공통][USER]
Screen: 게시글 상세. Path: /community/:postId
Breadcrumb: 커뮤니티 > 게시글 상세.
Post header: title large, author avatar+name, date, category badge, view count.
Body: text content area + embedded image placeholder.
If Q&A: answers section with ✅ 채택 button per answer.
Comments: textarea "댓글을 입력하세요" + "댓글 등록" olive button,
comment list (avatar/name/date/content/답글 link).
Bottom: "목록으로" gray button + "수정"/"삭제" (author only, right side).
```

**글 작성 수정.png**
```
[공통][USER]
Screen: 글 작성 수정. Path: /community/write
Breadcrumb: 커뮤니티 > 글 작성.
Title: "💬 글 작성".
카테고리 dropdown (자유게시판/정보공유/Q&A).
제목 input field full-width.
Rich text editor area: toolbar (B/I/list/image/link icons) + large editing zone.
이미지 첨부: upload zone camera icon + drag-drop text, S12 style.
Bottom: "등록하기" olive button + "취소" gray button.
```

---

### 📁 policy/

**정책 매칭 공문 생성.png**
```
[공통][USER][P2]
Screen: 정책 매칭 공문 생성. Path: /policy
Breadcrumb: 정책 매칭.
Title: "📜 정책 매칭 / 공문 생성".
Left panel: 조건 입력 — 작물 dropdown/재배 면적 input/지역 dropdown/농업 경력 input +
"매칭 검색" olive button.
Right panel: 매칭 정책 카드 list — each card: 정책명 bold/지원기관/지원내용 1-line/
지원금액/신청기한/상세보기 link. Cards white bg olive left border.
Bottom section: 공문 생성 — selected policy display + "공문 템플릿 생성" button +
preview area (document frame with editable fields) + "PDF 다운로드" button.
Layout similar to S13 main+side structure.
```

---

### 📁 stores/ (둘 다 Phase 2)

**가게 지도 조회.png**
```
[공통][USER][P2]
Screen: 가게 지도 조회. Path: /stores
Breadcrumb: 가게 정보 > 지도.
Title: "📍 가게 지도 조회".
Split: left 2/3 map area (Kakao Map placeholder, gray map bg, colored pin markers).
Right 1/3: search bar + filter dropdown (전체/종묘점/농약/비료/농기구).
Store cards vertically stacked: 가게명 bold/주소/초보 친화도 ★★★★☆/
제휴 olive badge/"제휴가게"/전화번호.
Pin click highlights card. Layout like S13 main+side.
```

**가게 상세.png**
```
[공통][USER][P2]
Screen: 가게 상세. Path: /stores/:storeId
Breadcrumb: 가게 정보 > 양평 종묘점.
Title: "📍 양평 종묘점".
Info card: name/address/phone/business hours/초보 친화도 stars.
Mini map (small gray map area showing store pin).
리뷰 section: overall rating large, review cards (author/rating stars/date/comment text).
취급 상품 section: product name/category list or small grid. Same info card style as S11.
```

---

### 📁 mypage/

**프로필 조회 수정.png**
```
[공통][USER]
Screen: 프로필 조회 수정. Path: /mypage
Breadcrumb: 마이페이지 > 프로필.
Title: "👤 프로필 관리".
Profile completion: olive progress bar "프로필 완성도 75%" (S13 style).
Avatar circle + "사진 변경" button.
기본 정보 section: 이름/이메일(read-only grayed)/전화번호/주소 inputs.
토지 정보 section: 농장명/면적/토양유형 (read-only + "농장 관리로 이동" olive link).
비밀번호 변경 section: 현재 비밀번호/새 비밀번호/비밀번호 확인 inputs.
Bottom: "저장" olive button.
```

**내 등록 이력.png**
```
[공통][USER]
Screen: 내 등록 이력. Path: /mypage/history
Breadcrumb: 마이페이지 > 등록 이력.
Title: "📋 내 등록 이력".
Tab bar: 종자 등록 | 파종 계획 | 수확 실적 (olive underline active).
Filter row: 상태 dropdown (전체/등록완료/취소) + 연도 dropdown (2026/2025).
History table: 등록일/작물명/수량or면적/상태badge(등록완료 green/취소 gray)/상세보기 link.
Pagination. Tab+table style matches S11 list structure.
```

**포인트 내역.png**
```
[공통][USER][P2]
Screen: 포인트 내역. Path: /mypage/points
Breadcrumb: 마이페이지 > 포인트.
Title: "🪙 포인트 내역".
Balance card: "현재 포인트 잔액" large, "1,250P" bold olive. S11 count card style.
Tabs: 적립/사용 내역 | 쿠폰 관리 (olive underline).
내역 table: 일시/사유/금액(+100P green, -500P red)/잔액 column.
쿠폰 tab: coupon cards — 코드/할인금액/유효기간/상태(사용가능olive/만료gray).
Empty State: coin icon + "포인트 내역이 없습니다."
```

**알림 내역.png**
```
[공통][USER][P2]
Screen: 알림 내역. Path: /mypage/notifications
Breadcrumb: 마이페이지 > 알림.
Title: "🔔 알림 내역".
Top-right: "전체 읽음 처리" text button.
Notification list items: type icon left (⚠️/📊/🛒/📢/✅),
title bold(if unread)/content preview 1-line/timestamp right.
Unread: bold text + olive left border. Read: normal weight, no border.
Types: 쏠림 경고, 수급 변동, 주문 알림, 관리자 공지, 승인 결과.
Empty State: bell icon + "새로운 알림이 없습니다."
Timeline style matches S11 활동 기일전보.
```

---

### 📁 gov/

**관할 수급 대시보드.png**
```
[공통][GOV]
Screen: 관할 수급 대시보드. Path: /gov
Breadcrumb: 지자체 > 대시보드.
Title: "📈 관할 지역 수급 대시보드 — 양평군".
4 KPI cards top row: 과잉 경고 작물 (🔴 3건)/부족 경고 작물 (🟠 2건)/
전체 등록률 (72% ↑)/전년 대비 변화 (+8% ↑). Cards with counters and trend arrows.
Main: "Top 10 작물 수급 현황" — horizontal gauge bars list
(same gauge style as balance view). Side panel: "쏠림 감지 알림" — warning items
with crop+severity. Bottom: YoY line chart mini.
KPI cards extend S11 count cards. Gauges extend S13 supply status.
```

**인접 지역 비교 분석.png**
```
[공통][GOV][P2]
Screen: 인접 지역 비교 분석. Path: /gov/compare
Breadcrumb: 지자체 > 지역 비교.
Title: "📈 인접 지역 비교 분석".
기준 지역: "양평군" fixed + 비교 지역 multi-select dropdown.
전국 평균 비교: grouped bar chart (양평군 olive vs 전국평균 gray) for top crops.
인접 시군구 비교: horizontal bars or radar — 양평/여주/가평/광주.
Bottom: "정책 제언" text area with 💡 icon — AI-generated suggestions. Beige bg box.
```

**재배 의향 현황.png**
```
[공통][GOV]
Screen: 재배 의향 현황. Path: /gov/cultivation
Breadcrumb: 지자체 > 재배 현황.
Title: "📈 재배 의향 현황".
3 view tabs: 작물별 뷰 | 지역별 뷰 | 시계열 뷰 (olive underline).
Filter: 기간 selector + 작물 filter dropdown.
작물별 뷰: horizontal stacked bar chart (등록량 vs 목표) per crop.
지역별 뷰: table rows per 읍/면/동 with crop registration counts.
시계열 뷰: line chart registration trends monthly.
Tab structure same as S11/community tabs.
```

**수급 보고서 생성.png**
```
[공통][GOV][P2]
Screen: 수급 보고서 생성. Path: /gov/reports
Breadcrumb: 지자체 > 보고서.
Title: "📈 수급 보고서 생성".
Options form: 기간 date range/지역 dropdown/작물 multi-select/
유형 radio (월간/분기/연간).
"보고서 생성" olive button with loading spinner icon.
Generated reports table: 보고서명/생성일시/상태(생성중 spinner/완료 ✅)/파일크기/
PDF 다운로드 button. Empty State: document icon + "생성된 보고서가 없습니다."
Form style from S10. Table from S11.
```

**농가 권고 공지 발송.png**
```
[공통][GOV][P2]
Screen: 농가 권고 공지 발송. Path: /gov/notices
Breadcrumb: 지자체 > 권고/공지.
Title: "📈 농가 권고/공지 발송".
대상 지정: 지역 읍면 multi-select + 작물 multi-select + 개별 농가 search input.
"선택된 대상: 47명" olive badge.
Message: 제목 input + 내용 textarea.
Channel: ☐ 앱 푸시 알림 ☐ SMS checkboxes.
"발송 미리보기" gray button + "발송하기" olive button.
발송 이력 table: 발송일시/제목/대상수/채널/발송상태. Form from S12. Info box from S10.
```

**수급 데이터 다운로드.png**
```
[공통][GOV]
Screen: 수급 데이터 다운로드. Path: /gov/download
Breadcrumb: 지자체 > 데이터 다운로드.
Title: "📈 수급 데이터 다운로드".
Condition form: 기간 date range/지역 dropdown/작물 multi-select/
데이터 항목 checkboxes (☐ 수급량 ☐ 가격 ☐ 등록현황 ☐ 의향데이터)/
파일 형식 radio (○ CSV ○ XLSX).
"미리보기" gray button → preview table (5 sample rows, S11 table style).
"다운로드" olive button.
💡 Info note (beige bg): "최대 10,000건까지 다운로드 가능합니다."
```

---

### 📁 admin/

**관리자 대시보드.png**
```
[공통][ADMIN]
Screen: 관리자 대시보드. Path: /admin
Title: "⚙️ 관리자 대시보드".
Left sidebar visible with all admin menu items, 대시보드 highlighted.
4 KPI cards: 가입 승인 대기 (red alert badge "5건")/오늘 등록 건수/
주간 종자 구매량/로스율 (%).
Charts: 일별 가입 추이 line chart + 작물별 선호도 donut chart.
Bottom: 외부 API 상태 list — 기상청 🟢정상/KAMIS 🟢정상/농산물유통 🔴장애 +
마지막 동기화 time. KPI extends S11 count cards.
```

**사용자 목록.png**
```
[공통][ADMIN]
Screen: 사용자 목록. Path: /admin/users
Left sidebar, 사용자관리 highlighted.
Title: "⚙️ 사용자 관리". "총 1,234명".
Search bar + filters: 역할 dropdown (전체/일반/농부/지자체/관리자),
상태 dropdown (전체/활성/정지).
User table: 이름/이메일/역할 badge(olive for 농부, blue for 지자체, red for 관리자)/
가입일/상태 badge(활성 green/정지 red)/
actions (역할변경 dropdown/정지토글/감사로그 link). Pagination. S11 table style.
```

**농부 승인 반려.png**
```
[공통][ADMIN]
Screen: 농부 승인 반려. Path: /admin/approvals
Left sidebar, 농부승인 highlighted.
Title: "⚙️ 농부 승인/반려".
Status tabs: 대기중 | 승인완료 | 반려 (olive underline).
Pending table: 신청자명/농장명/면적/토양유형/신청일시/actions.
Expandable detail row: full farm info (주소/주요작물/면적 detail).
Per-row actions: "승인" olive button + "반려" red outline button.
반려 modal: 반려 사유 textarea + "반려 확인" button.
Status flow: PENDING → APPROVED/REJECTED step indicator.
S10 info box + S11 badge styling.
```

**작물 마스터 관리.png**
```
[공통][ADMIN]
Screen: 작물 마스터 관리. Path: /admin/crops
Left sidebar, 작물마스터 highlighted.
Title: "⚙️ 작물 마스터 관리".
"작물 등록" olive button top-right.
Crop table: 작물코드/작물명/카테고리(채소/과일/곡물)/시즌/상태 toggle(활성/비활성)/
수정 action link.
Edit modal: 작물명/카테고리 dropdown/시즌 multi-select/단위수확량 input.
Special: "밸런스 재계산" orange button with refresh icon.
💡 Info: "재계산은 전체 수급 데이터에 영향을 줍니다." S11 table + S10 form.
```

**외부 데이터 연동.png**
```
[공통][ADMIN][P2]
Screen: 외부 데이터 연동. Path: /admin/data
Left sidebar, 데이터연동 highlighted.
Title: "⚙️ 외부 데이터 연동 관리".
Source table: API명(기상청/KAMIS/농산물유통)/상태 dot(🟢/🔴)/
갱신주기 dropdown(1h/6h/24h)/마지막 갱신 datetime/설정·수동갱신 actions.
Settings expandable panel: URL/API Key(••••)/timeout/retry count.
이상값 탐지 로그 table: 일시/소스/항목/탐지값/기준값/상태badge.
RAG 설정 sub-section: document source/embedding model.
```

**밸런스 엔진 관리.png**
```
[공통][ADMIN][P2]
Screen: 밸런스 엔진 관리. Path: /admin/engine
Left sidebar, 밸런스엔진 highlighted.
Title: "⚙️ 밸런스 엔진 관리".
Current config card: active threshold/weight/period values displayed.
Config form: 임계치 sliders (부족 경계%/과잉 경계%/쏠림 경계%, olive fill),
가중치 sliders (수급35/환경25/수익25/역량15, sum must=100%),
계산 주기 dropdown (5분/15분/1시간/수동).
"Hot Reload" orange button + "저장" olive + "초기화" gray.
Change history table: 일시/변경자/항목/이전값/변경값.
Slider style extends S13 progress bar.
```

**시스템 헬스.png**
```
[공통][ADMIN][P2]
Screen: 시스템 헬스. Path: /admin/health
Left sidebar, 시스템헬스 highlighted.
Title: "⚙️ 시스템 헬스 모니터링".
4 component cards: DB PostgreSQL 🟢/API Spring Boot 🟢/Cache Redis 🟢/Queue 🟡지연.
Each: status dot, component name, uptime, avg response time.
Heatmap: API endpoint response times (rows=endpoints, cols=24 hours, color intensity).
Line chart: request count + response time + error rate over time.
Error log table: 일시/endpoint/status code/error message/count.
```

**커뮤니티 관리.png**
```
[공통][ADMIN]
Screen: 커뮤니티 관리. Path: /admin/community
Left sidebar, 커뮤니티관리 highlighted.
Title: "⚙️ 커뮤니티 관리".
Search bar + filters: 카테고리/상태(전체/게시중/삭제됨/신고접수)/기간.
Post table: ID/제목/작성자/카테고리/작성일/조회수/신고수(red if>0)/상태badge/actions.
Action buttons: "삭제" red + "공지 지정" olive + "신고 처리" orange.
Report modal: 신고 내역 list + 처리 radio (경고/삭제/무시) + "처리" button.
Empty State: document icon + "게시글이 없습니다." S11 table.
```

**상점 관리.png**
```
[공통][ADMIN][P2]
Screen: 상점 관리. Path: /admin/shop
Left sidebar, 상점관리 highlighted.
Title: "⚙️ 상점 관리".
Tabs: 상품 관리 | 분쟁 처리 (olive underline).
상품 tab: table — 상품명/판매자/카테고리/가격/등록일/상태badge(판매중/승인대기/비활성화)/
승인·반려·비활성화 actions.
분쟁 tab: table — 분쟁번호/구매자/판매자/상품/사유/접수일/상태badge(접수/처리중/완료)/처리 action.
Empty State for each tab. S11 table style.
```

**가게 정보 관리.png**
```
[공통][ADMIN][P2]
Screen: 가게 정보 관리. Path: /admin/stores
Left sidebar, 가게관리 highlighted.
Title: "⚙️ 가게 정보 관리".
"가게 등록" olive button top-right.
Store table: 가게명/주소/카테고리/상태(활성/비활성 badge)/제휴 toggle(✅/❌)/
등록일/수정·삭제 actions.
Edit modal: 가게명/주소/전화/영업시간/카테고리 dropdown/취급상품 tag chips/제휴 toggle.
Empty State: shop icon + "등록된 가게가 없습니다." S11 table + S10 form.
```

**쿠폰 보상 관리.png**
```
[공통][ADMIN][P2]
Screen: 쿠폰 보상 관리. Path: /admin/coupons
Left sidebar, 쿠폰관리 highlighted.
Title: "⚙️ 쿠폰/보상 관리".
Tabs: 쿠폰 관리 | 포인트 정책 (olive underline).
쿠폰 tab: "쿠폰 발급" button + table — 코드/유형(정액/정률)/할인(금액·%)/
유효기간/대상(전체/농부/특정)/발급수/사용수/상태/수정·비활성화 actions.
Issuance form: 유형 radio/할인값/기간 date range/대상 filter/수량.
포인트 정책 tab: policy cards — 종자등록 100P/영수증 50P/파종등록 30P
each with enable/disable toggle + amount input.
"정책 저장" olive button. S11 table + S10 form toggle style.
```

---

## 5. 최종 점검 체크리스트

| # | 점검 항목 | 결과 |
|---|---------|------|
| 1 | **47개 화면 모두 포함했는가** | ✅ S-01, S-02~04, S-10~14, S-20~23, S-30~36, S-40~42, S-44, S-45~46, S-50~53, S-60~65, S-70~80 = **47개** 확인 |
| 2 | **URL 기준 폴더 구조가 맞는가** | ✅ 12개 폴더(auth/farm/balance/recommend/shop/community/policy/stores/mypage/gov/admin) + 최상위 랜딩 + reference/farm |
| 3 | **파일명이 모두 한글인가** | ✅ 전체 47개 파일 모두 한글 화면명.png 형식, URL·영어 파일명 없음 |
| 4 | **기준 farm PNG 스타일이 유지되었는가** | ✅ 모든 프롬프트에 공통 스타일 프리픽스 적용, S10~S14 참조 명시 |
| 5 | **관리자/지자체/일반 화면 레이아웃이 구분되었는가** | ✅ admin=좌측 사이드바, gov=GNB+분석 톤, auth=단일 카드 중앙, user=GNB+브레드크럼 |
| 6 | **Phase 2 배지 규칙이 통일되었는가** | ✅ 모든 Phase 2 화면 프롬프트에 `[P2]` 프리픽스 + "Phase 2 badge top-right" 명시 |
| 7 | **기존 S10~S14 원본이 보존되었는가** | ✅ `reference/farm/` 폴더에 복사 보관 |
| 8 | **IA 문서에 없는 화면을 추가하지 않았는가** | ✅ 추가 화면 없음 |
| 9 | **IA 문서에 있는 화면을 누락하지 않았는가** | ✅ 누락 없음 |
| 10 | **Empty State 대상 화면이 반영되었는가** | ✅ 장바구니/주문내역/게시글목록/알림내역/포인트내역/보고서/커뮤니티관리/상점관리/가게관리 |

### 화면 수 합산 검증

| 영역 | 화면 수 | MVP | Phase 2 |
|------|:------:|:---:|:-------:|
| 최상위·인증 | 4 | 4 | — |
| 농장 | 5 | 4 | 1 |
| 밸런스 | 2 | 2 | — |
| 추천 | 2 | 2 | — |
| 상점 | 7 | — | 7 |
| 커뮤니티 | 3 | 3 | — |
| 정책 | 1 | — | 1 |
| 가게 | 2 | — | 2 |
| 마이페이지 | 4 | 2 | 2 |
| 지자체 | 6 | 3 | 3 |
| 관리자 | 11 | 5 | 6 |
| **합계** | **47** | **25** | **22** |

---

> **문서 이력**
>
> | 버전 | 날짜 | 작성자 | 변경 내용 |
> |------|------|--------|----------|
> | v1.0 | 2026-04-23 | 서비스기획팀 | 초안 — 47개 화면 폴더 구조, 매핑표, 설계 포인트, 역할별 레이아웃, 이미지 생성 프롬프트, 점검 체크리스트 작성 |
