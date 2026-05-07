# 🧑‍💻 FarmBalance 6인 역할 분담표 (최종)

> **작성일:** 2026-04-24  
> **프로젝트:** FarmBalance — 농산물 수급 밸런스 플랫폼  
> **기준:** HTML 목업 38 화면 + 챗봇 UI 1 화면 = 총 39 화면

---

## 📊 총괄 분담표

| 역할 | 담당자 | 담당 도메인 | FE 화면 | 챗봇/AI |
|:---:|:---:|:---|:---:|:---|
| 1번 | **지윤** | 공통 인프라 + Auth + Landing + MyPage(프로필/주문) | 6 | 챗봇 공통 백엔드 |
| 2번 | **지은** | Farm + Balance + Recommend | 7 | 작물 추천 Agent |
| 3번 | **나은** | Shop + MyPage(판매관리) | 6 | 상품 추천 Agent |
| 4번 | **수경** | Stores + Policy + Gov | 7 | 정책/지자체 Agent |
| 5번 | **우혁** | Community + 챗봇 UI + MyPage(알림) | 5 | 챗봇 UI + 상담 Agent |
| 6번 | **현석** | Admin + RAG | 8 | Bedrock RAG 전담 |

---

## 1번 — 지윤 (공통 인프라 + Auth + Landing + MyPage)

### 담당 화면 (FE — 6화면)
| ID | 화면 | 파일 |
|:---|:---|:---|
| L-01 | 랜딩페이지 (비회원 CTA) | `landing.html` |
| AU-01 | 로그인 | `auth/login.html` |
| AU-02 | 회원가입 (단계별 폼) | `auth/signup.html` |
| AU-03 | 비밀번호 찾기 | `auth/password-reset.html` |
| MP-01 | 프로필 조회/수정 | `mypage/profile.html` |
| MP-02 | 주문 내역 | `mypage/orders.html` |

### 담당 기능 (BE + 공통)
- Docker + PostgreSQL + Redis + Nginx 환경 구성
- Spring Boot 초기 설정 + 헥사고날 패키지 구조 생성
- API 응답 틀셋 (ApiResponse / ErrorCode / GlobalExceptionHandler)
- JWT 인증/인가 필터 (SecurityConfig + JwtProvider)
- OAuth2 소셜 로그인 어댑터 (카카오)
- BFF(Next.js) 프록시 계층 구축
- 공통 UI 컴포넌트 라이브러리 (버튼/입력/테이블/모달)
- 회원가입 / 로그인 / 비밀번호 재설정 REST API
- 프로필 수정 (닉네임 중복 검증) API
- 주문 내역 조회 API

### 🤖 챗봇 담당
- **챗봇 공통 백엔드 인프라**
  - WebSocket 서버 설정 (실시간 메시지 송수신)
  - 대화 세션 관리 + 대화 이력 DB 어댑터
  - 챗봇 메시지 라우터 (도메인별 Agent로 분기)
  - 챗봇 응답 스트리밍 구현 (SSE/WebSocket)

---

## 2번 — 지은 (Farm + Balance + Recommend)

### 담당 화면 (FE — 7화면)
| ID | 화면 | 파일 |
|:---|:---|:---|
| FM-01 | 농장 관리 (탭: 정보/종자이력/AI예측) | `farm/farm-manage.html` |
| FM-02 | 농장 등록 신청 (3열 그리드 + 다중작물 칩) | `farm/farm-register.html` |
| FM-03 | 종자 구매 등록 (동적 카드 추가/삭제) | `farm/seed-register.html` |
| BL-01 | 작물 밸런스 조회 (수급 테이블) | `balance/balance-list.html` |
| BL-02 | 작물 밸런스 상세 (Chart.js 시각화) | `balance/balance-detail.html` |
| RC-01 | AI 추천 목록 (카드 리스트) | `recommend/recommend-list.html` |
| RC-02 | AI 추천 상세 (4항목 점수 시각화) | `recommend/recommend-detail.html` |

### 담당 기능 (BE)
- 농장 CRUD API + PNU 코드 자동 생성
- 종자 구매 이력 관리 API
- 수급 데이터 조회 + 비율 계산 + 차트 데이터 가공 API
- AI 추천 점수 산출 엔진 (4항목 가중: 수급35%+환경25%+수익25%+역량15%)
- 추천 결과 저장 + 이력 조회 API
- **[외부 API] KOSIS 연동 어댑터** (10년 생산량 배치 적재)
- **[외부 API] 기상청 연동 어댑터** (단기예보 + ASOS 배치)
- **[외부 API] 흙토람 연동 어댑터** (PNU→토양 7종 성분)
- **[Engine] 수급 밸런스 엔진** 구현

### 🤖 챗봇 담당
- **작물 추천 챗봇 Agent**
  - Gemini 기반 추천 사유 자연어 생성 ("왜 이 작물을 추천하나요?")
  - 수급 데이터 대화형 요약 ("올해 배추 수급 상황이 어때?")
  - 기상 + 토양 정보 기반 파종 시기 상담
  - 이미지 업로드 → Gemini 병해충 진단

---

## 3번 — 나은 (Shop + MyPage 판매관리)

### 담당 화면 (FE — 6화면)
| ID | 화면 | 파일 |
|:---|:---|:---|
| SH-01 | 상품 탐색 (카탈로그 + 필터) | `shop/product-browse.html` |
| SH-02 | 상품 상세 (정보 + 구매) | `shop/product-detail.html` |
| SH-03 | 장바구니 | `shop/cart.html` |
| SH-04 | 주문/결제 | `shop/checkout.html` |
| MP-03 | 판매 상품 관리 (판매자 CRUD) | `mypage/seller-products.html` |
| MP-04 | 판매 주문 관리 (접수/배송) | `mypage/seller-orders.html` |

### 담당 기능 (BE)
- 상품 CRUD API (등록/수정/삭제/조회)
- 장바구니 기능 (추가/수량변경/삭제) API
- 주문/결제 처리 API
- 판매자 상품 관리 + 판매 주문 관리 API
- 파일 업/다운로드 모듈 (상품 이미지)
- **[외부 API] 농사로 연동 어댑터** (2-Step + HTML 정제)

### 🤖 챗봇 담당
- **상품 추천 챗봇 Agent**
  - 상품 검색 대화 ("유기농 비료 추천해줘")
  - 농사로 데이터 기반 재배 기술 상담
  - 주문 상태 조회 대화 ("내 주문 어디까지 왔어?")

---

## 4번 — 수경 (Stores + Policy + Gov)

### 담당 화면 (FE — 7화면)
| ID | 화면 | 파일 |
|:---|:---|:---|
| ST-01 | 가게 지도 조회 (카카오맵) | `stores/store-map.html` |
| PO-01 | 정책 목록 (검색/필터) | `policy/policy-list.html` |
| GV-01 | 관할 수급 대시보드 (KPI) | `gov/gov-dashboard.html` |
| GV-02 | 재배 의향 현황 | `gov/gov-cultivation.html` |
| GV-03 | 인접 지역 비교 분석 | `gov/gov-compare.html` |
| GV-04 | 판매 현황 분석 | `gov/gov-sales.html` |
| GV-05 | 수급 데이터 다운로드 | `gov/gov-download.html` |

### 담당 기능 (BE)
- 가게 정보 조회 + 카카오맵 좌표 연동 API
- 정책 데이터 검색/필터 API
- 지자체 대시보드 데이터 집계 API
- 인접 지역 비교 분석 API
- CSV/Excel 다운로드 API
- **[외부 API] 카카오맵 연동 어댑터** (주소→좌표 격자변환)

### 🤖 챗봇 담당
- **정책/지자체 챗봇 Agent**
  - 적합 정책 매칭 대화 ("나한테 맞는 보조금 뭐 있어?")
  - 정책 자동 요약
  - 지자체 수급 현황 브리핑 ("양평군 올해 배추 현황 알려줘")

---

## 5번 — 우혁 (Community + 챗봇 UI)

### 담당 화면 (FE — 5화면)
| ID | 화면 | 파일 |
|:---|:---|:---|
| CM-01 | 게시글 목록 | `community/community-list.html` |
| CM-02 | 게시글 상세 (댓글) | `community/community-detail.html` |
| CM-03 | 글 작성/수정 (에디터) | `community/community-write.html` |
| MP-05 | 알림 내역 | `mypage/notifications.html` |
| **CB-01** | **💬 챗봇 대화 화면** | **`chatbot/chat.html` (신규)** |

### 담당 기능 (BE)
- 게시글 CRUD + 댓글 + 신고 API
- 알림 조회 + 읽음 처리 API
- **[Infra] FCM 푸시 알림 발송 + 알림 이력 DB**
- **[Infra] Redis 캐싱 전략** (기상3h/토양24h/AI 1h)

### 🤖 챗봇 담당
- **챗봇 프론트엔드 UI 전체 구현**
  - 채팅 말풍선 UI (사용자/AI 구분)
  - 이미지 업로드 (병해충 진단용)
  - 메시지 스트리밍 (타이핑 애니메이션)
  - 대화 이력 표시 + 새 대화 시작
  - 도메인별 Agent 선택 (농장/추천/정책/상담 등)
- **커뮤니티 상담 챗봇 Agent**
  - 게시글 관련 질문 대화
  - 농업 일반 상담 (Gemini 텍스트)

---

## 6번 — 현석 (Admin + RAG)

### 담당 화면 (FE — 8화면)
| ID | 화면 | 파일 |
|:---|:---|:---|
| AD-01 | 관리자 대시보드 | `admin/admin-dashboard.html` |
| AD-02 | 사용자 관리 | `admin/admin-users.html` |
| AD-03 | 농부 승인/반려 | `admin/admin-approvals.html` |
| AD-04 | 작물 기준정보 관리 | `admin/admin-crops.html` |
| AD-05 | 외부 데이터 연동 관리 | `admin/admin-data.html` |
| AD-06 | 밸런스 엔진 관리 | `admin/admin-engine.html` |
| AD-07 | 커뮤니티 관리 | `admin/admin-community.html` |
| AD-08 | 상점 관리 | `admin/admin-shop.html` |

### 담당 기능 (BE)
- 사용자 관리 + 농부 승인/반려 API
- 작물 기준정보 CRUD API
- 외부 데이터 연동 관리 API
- 엔진 파라미터 설정 API
- 커뮤니티 관리 (게시글/신고) API
- 상점 관리 (상품 승인) API
- 외부 API 공통 Retry/CircuitBreaker

### 🤖 RAG 전담
- **Bedrock RAG 파이프라인 전체 구축**
  - S3 PDF 업로드 + Knowledge Base 생성/동기화
  - RAG API 엔드포인트 구현 (질문 → 검색 → 응답)
  - 출처 표기 기능 (어떤 문서에서 답변했는지)
  - Bedrock Agent Lambda 함수 구현 (날씨/수급/일정)
  - AI 응답 파서 + 개인정보 마스킹
  - AI 연동 REST API 엔드포인트
  - 관리자 분석 Agent (수급 이상 탐지 + 자동 리포트)

---

## 🤖 챗봇 아키텍처 협업 구조

```
사용자 (챗봇 UI) ─────────── [우혁이 구현]
      │
      ▼
메시지 라우터 ──────────────── [지윤이 구현]
      │
      ├──► 작물 추천 Agent ──── [지은이 구현] ── Gemini
      ├──► 상품 추천 Agent ──── [나은이 구현] ── Gemini
      ├──► 정책/지자체 Agent ── [수경이 구현] ── Gemini
      ├──► 커뮤니티 상담 Agent ─ [우혁이 구현] ── Gemini
      └──► RAG 전문 상담 ────── [현석이 구현] ── Bedrock RAG
```

---

## 📅 작업 순서 (의존성 기반)

```
Week 1: [지윤] 공통 인프라 + 챗봇 백엔드 세팅 (전원 선행 작업)
         [우혁] 챗봇 UI 와이어프레임 착수
         [현석] Bedrock RAG Knowledge Base 구축 시작
         [전원] 각자 도메인 FE 화면 구현 시작

Week 2: [지윤] Auth FE/BE 완성 → 전원 로그인 연동 가능
         [지은] Farm + 외부API(KOSIS/기상청/흙토람) 연동
         [나은] Shop FE + 상품 CRUD API
         [수경] Stores(카카오맵) + Gov 대시보드
         [우혁] Community FE/BE + 챗봇 UI 완성
         [현석] Admin 템플릿 제작 + RAG API 구현

Week 3: [지윤] 챗봇 메시지 라우터 완성
         [전원] FE-BE 연동 + 각자 챗봇 Agent 구현

Week 4: [전원] 챗봇 Agent ↔ 챗봇 UI 통합 테스트
         [전원] 도메인별 E2E 테스트 + 버그 수정

Week 5: [전원] 최종 QA + 배포 + 발표 준비
```

---

## 🎯 작업량 균형 검증

| 담당자 | FE 화면 | BE API(예상) | 외부 연동 | 챗봇/AI | 체감 난이도 |
|:---:|:---:|:---:|:---:|:---|:---:|
| 지윤 | 6 | 7~8 | — | 챗봇 공통 백엔드 | ★★★ |
| 지은 | 7 | 8~10 | KOSIS, 기상청, 흙토람 | 추천 Agent | ★★★ |
| 나은 | 6 | 6~8 | 농사로 | 상품 Agent | ★★★ |
| 수경 | 7 | 6~8 | 카카오맵 | 정책/지자체 Agent | ★★★ |
| 우혁 | 5 | 5~6 | — | 챗봇 UI + 상담 Agent | ★★★ |
| 현석 | 8 | 8~10 | — | RAG 전담 (Bedrock) | ★★★ |
