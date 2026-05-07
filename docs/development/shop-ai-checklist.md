# ✅ Shop AI 자동화 + 가이드봇 — 종합 구현 체크리스트

> 모든 작업을 순서대로 정리한 체크리스트. 위에서부터 차례대로 진행합니다.
>
> 📎 관련 설계 문서:
> - `docs/architecture/shop-ai-automation.md` — Shop AI 자동화 설계
> - `docs/architecture/guide-bot-design.md` — AI 가이드 마스코트 설계

---

## Phase 1: AI 가이드 마스코트 — 정적 버전 (프론트만, AI 없음)

> 예상 기간: 2~3일 | 비용: ₩0

### 1-1. 캐릭터 제작

- [x] 마스코트 컨셉 결정 → **걸어다니는 농부 아저씨 (The Old-Man)**
- [x] ~~SVG 또는~~ Lottie 애니메이션 캐릭터 제작
  - [x] 이동 상태 (walking): LottieFiles에서 다운로드 (`walking.json`)
  - [ ] 기본 상태 (idle): 별도 Lottie 미적용 (walking 재활용 중)
  - [ ] 말하는 상태 (talking): 별도 Lottie 미적용
- [x] 캐릭터 애니메이션 파일을 `public/guide/` 폴더에 배치 (`walking.json`)

### 1-2. GuideBot 컴포넌트 기본 구조

- [x] `components/common/GuideBot/GuideBot.tsx` 생성
  - [x] `position: fixed` 로 화면 위에 떠다니는 캐릭터
  - [x] Lottie 기반 걷기 애니메이션 (lottie-react + dynamic import)
  - [x] 말풍선 UI (텍스트 + 이전/다음/완료/닫기 버튼)
  - [x] 축소 모드 — Footer에서 좌우 산책 (25초 주기 왕복)
  - [x] 축소 모드 hover → 걷기 멈춤 + 말풍선 표시
  - [x] 질문 모드 — "안내해드릴까요?" (네/아니요 버튼)
- [x] `components/common/GuideBot/GuideBot.module.css` 생성
  - [x] 캐릭터 이동 `transition` 애니메이션 (1.8s ease)
  - [x] 말풍선 팝업 `bubble-pop` 애니메이션
  - [x] 타겟 요소 하이라이트용 오버레이 스타일 (`box-shadow` 홀)
  - [x] 축소 모드: Footer 워킹 CSS animation + 방향 전환
  - [x] 말풍선 위/아래 자동 전환 (bubbleAbove/bubbleBelow)
  - [x] 말풍선 scaleX 반전 보정 (tooltip-flip animation)
  - [x] 반응형 처리 (모바일 768px 이하 — 캐릭터/말풍선 축소)

### 1-3. 가이드 시나리오 데이터 정의

- [x] `components/common/GuideBot/guideScenarios.ts` 생성
- [x] 각 페이지별 가이드 스텝 정의:
  - [x] `/` (메인 페이지): 네비게이션 메뉴 안내 (내 농장, 수급분석, 상점, AI 추천) — 4스텝
  - [x] `/shop` (상점 페이지): 상점 환영, 장바구니, 카테고리, 검색, 상품 그리드 — 5스텝
  - [x] `/farm` (농장 페이지): 농장 관리, 재배 등록, 수확 기록 — 3스텝
  - [x] `/mypage/seller` (판매자 페이지): 상품 등록, 주문 관리 — 2스텝
  - [x] `/balance` (수급 분석): 수급 현황 — 1스텝
- [x] 각 스텝에 포함할 정보: target(CSS 선택자), message, position

### 1-4. 가이드 상태 관리 Hook

- [x] `components/common/GuideBot/useGuideBot.ts` 생성
  - [x] `localStorage`로 첫 방문 여부 체크
  - [x] 현재 페이지 경로에 맞는 시나리오 자동 선택
  - [x] 현재 스텝 인덱스 관리 (prev/next/stop)
  - [x] 타겟 요소 좌표 계산 (`getBoundingClientRect`)
  - [x] 캐릭터 위치 상태 (`{ x, y }`)
  - [x] 가이드 활성/비활성 상태 (mode: minimized/asking/guiding)
  - [x] 가이드 시작 시 최상단 스크롤 (`scrollTo`)
  - [x] 가이드 중 스크롤 잠금 (`body.overflow = hidden`)
  - [x] 이동 방향에 따른 캐릭터 좌우 반전 (facingRight)

### 1-5. 페이지 타겟 요소에 data-guide 속성 부여

- [x] `components/layout/Header/` — 네비게이션 메뉴에 `data-guide` 추가 (nav-farm, nav-shop 등)
- [x] `app/(main)/shop/page.tsx` — 카테고리 탭, 검색바, 상품 그리드에 `data-guide` 추가
- [ ] `app/(main)/farm/page.tsx` — 주요 버튼에 `data-guide` 추가 (시나리오만 정의, 실제 속성 미추가)
- [ ] `app/(main)/mypage/seller/page.tsx` — 등록 버튼에 `data-guide` 추가 (시나리오만 정의, 실제 속성 미추가)

### 1-6. 레이아웃에 GuideBot 삽입

- [x] `app/(main)/layout.tsx`에 `<GuideBot />` 추가
- [x] 로그인한 사용자에게만 표시 (`fb-user` 쿠키 체크)
- [x] 가이드 비활성화 설정 (아니요 버튼 + X 닫기로 종료 가능)

### 1-7. 테스트 및 QA

- [x] 메인/상점 페이지에서 가이드 시작 → 캐릭터 이동 → 말풍선 표시 확인
- [x] 가이드 중 페이지 이동 시 시나리오 전환 확인 (minimized로 리셋)
- [x] 닫기/아니요 동작 확인
- [x] 축소 모드(Footer 산책)에서 클릭 시 재시작 확인
- [x] 모바일 뷰포트 반응형 스타일 적용 (768px media query)
- [x] `localStorage` 첫 방문 감지 정상 동작 확인

---

## Phase 2: AI 가이드 마스코트 — AI 동적 대사 (무료 LLM)

> 예상 기간: 1~2일 | 비용: ₩0 (Gemini Flash / Groq 무료 한도)

### 2-1. AI 서버 가이드 엔드포인트

- [ ] `ai/app/models/guide.py` — Request/Response Pydantic 모델 생성
- [ ] `ai/app/services/guide_service.py` — 가이드 메시지 생성 서비스
  - [ ] LLM 프롬프트 작성 (양평군 농업 컨텍스트, 친근한 톤, 1~2문장)
  - [ ] 사용자 유형별 프롬프트 분기 (첫 방문/재방문/판매자/구매자)
  - [ ] 에러 시 정적 메시지 폴백 처리
- [ ] `ai/app/routers/guide.py` — `POST /guide/message` 엔드포인트
- [ ] `ai/app/main.py` — 가이드 라우터 등록

### 2-2. Backend 프록시 (필요 시)

- [ ] Spring Boot에서 AI 서버로 프록시하는 경우 어댑터 추가
  - 또는 프론트에서 직접 AI 서버 호출 (BFF 경유)

### 2-3. Frontend BFF Route Handler

- [ ] `app/api/ai/guide/route.ts` — AI 서버 호출 프록시
  - [ ] 사용자 정보 (유형, 최근 활동) 포함하여 AI 서버 요청
  - [ ] 응답 캐싱 고려 (같은 페이지+같은 타겟 → 캐시 활용)

### 2-4. useGuideBot Hook 확장

- [ ] AI 호출 로직 추가 (정적 메시지 대신 AI 메시지 사용)
- [ ] AI 응답 실패 시 정적 메시지로 폴백
- [ ] 로딩 상태 처리 (AI 응답 대기 중 말풍선에 "..." 표시)
- [ ] 요청 디바운싱 (빠른 스텝 전환 시 불필요한 호출 방지)

### 2-5. 테스트

- [ ] AI 메시지 정상 생성 확인
- [ ] 첫 방문/재방문 시 다른 대사 출력 확인
- [ ] AI 서버 다운 시 정적 폴백 동작 확인
- [ ] 무료 한도 초과 시 정상 폴백 확인

---

## Phase 3: AI 상품 설명 자동 생성

> 예상 기간: 1~2일 | 비용: ₩0

### 3-1. AI 서버 상품 어시스트 엔드포인트

- [x] `ai/app/models/product_assist.py` — 요청/응답 모델
- [x] `ai/app/services/product_assist_service.py` — 상품 설명 생성 서비스
  - [x] 프롬프트: 상품명 + 카테고리 → 양평군 특화 매력적 설명 생성
  - [x] 출력 길이 제한 (500자 이내)
- [x] `ai/app/routers/product_assist.py` — `POST /product-assist/description`

### 3-2. Frontend 연동

- [x] `app/api/ai/product-assist/route.ts` — BFF Route Handler
- [x] `app/(main)/mypage/seller/register/page.tsx` 수정
  - [x] "✨ AI 설명 생성" 버튼 추가 (설명 textarea 상단)
  - [x] 버튼 클릭 → API 호출 → 생성된 설명을 textarea에 자동 채움
  - [x] 로딩 상태 표시 (스피너 + "AI가 설명을 작성하고 있어요...")
  - [x] 기존 설명이 있을 경우 "덮어쓰기 확인" 모달
- [x] `app/(main)/mypage/seller/[productId]/edit/page.tsx`에도 동일 적용

### 3-3. 테스트

- [x] 상품명+카테고리 입력 → AI 설명 생성 확인
- [x] 생성된 설명 수정 가능 확인
- [x] AI 서버 오류 시 에러 메시지 표시 확인

---

## Phase 4: AI 상품 정보 전체 자동 채우기 (Autofill - 카테고리, 가격, 재고 통합)

> 예상 기간: 1.5일 | 비용: ₩0

### 4-1. AI 서버 Autofill 엔드포인트 (구현 완료)

- [x] `product_assist_service.py`에 전체 필드 자동 생성(`autofill_product`) 메서드 추가
  - [x] DB 카테고리 목록을 프롬프트에 주입하여 DB 내 카테고리만 선택하도록 강제
  - [x] 상품명 기반으로 적정 가격 범위, 기본 재고량 추론 기능 포함
- [x] `product_assist.py`에 `POST /product-assist/autofill` 엔드포인트 추가

### 4-2. Frontend 연동 (구현 완료)

- [x] `app/api/ai/product-assist/autofill/route.ts` BFF 라우트 추가 (Timeout 60초 설정)
- [x] 상품 등록/수정 폼에 "✨ AI 자동 채우기" 버튼 추가
- [x] 버튼 클릭 시 상품명 기반으로 카테고리, 가격, 재고, 설명을 한 번에 채움
- [x] AI가 DB에 없는 카테고리명을 생성할 경우, 기존 DB 카테고리명과 유사도 매칭 (또는 '기타'로 Fallback) 처리 추가
- [x] 가이드봇(GuideBot)과 연동하여 자동 채우기 완료 시 말풍선 안내 제공

### 4-3. 테스트 (구현 완료)

- [x] 다양한 상품명으로 전체 필드(카테고리, 가격, 재고, 설명) 채우기 정확도 확인
- [x] 생성된 정보 수동 변경 가능 확인
- [x] AI가 존재하지 않는 임의의 카테고리를 만들지 않고 기존 목록 안에서 매칭되는지 확인

---

## Phase 5: (삭제됨 - Phase 4 Autofill에 통합)

- [x] 가격 추천 및 카테고리 추천 기능이 Autofill 기능 하나로 통합되어 완료됨.

---

## Phase 6: 판매자 인사이트 (선택)

> 예상 기간: 2일 | 비용: ₩0

### 6-1. 인사이트 생성

- [x] 판매자 주문 데이터 집계 (인기 상품, 주문 추세, 재고 예측)
- [x] AI가 집계 데이터를 자연어 인사이트로 변환
- [x] `POST /product-assist/insight` 엔드포인트

### 6-2. Frontend 연동

- [x] 판매자 대시보드 상단에 "🤖 AI 인사이트" 카드 추가
- [x] 매일 1회 갱신 (또는 대시보드 진입 시)

---

## Phase 7: Farm(재배 이력) 데이터 연동 AI 고도화

> ✅ 완료 — Farm 도메인 재배 이력 API가 구현된 상태에서 AI 자동 채우기에 연동 완료
> 📄 상세 구현 문서: [phase7-farm-ai-integration.md](./phase7-farm-ai-integration.md)

### 7-1. 재배 이력 데이터 연동

- [x] AI 서버 모델에 `FarmContext` / `HarvestSummary` 스키마 추가 (`models/product_assist.py`)
- [x] `AutofillRequest`에 `farm_context` Optional 필드 추가 (하위 호환)
- [x] AI 서비스 프롬프트에 재배 이력 팩트 블록 삽입 (`services/product_assist_service.py`)
- [x] 원산지, 토양, 수확량/등급 정보를 AI가 설명에 반영하도록 프롬프트 규칙 추가
- [x] BFF autofill Route Handler에서 `farmContext` → `farm_context` 케이스 변환 전달

### 7-2. Frontend 고도화

- [x] AI 자동 채우기 실행 시 내 농장 목록/재배 이력 자동 조회 → farmContext 구성
- [x] 상품명과 재배 작물명 매칭 로직 (첫 단어 기반 부분 매칭)
- [x] 재배 이력 기반 시 "🌱 내 농장의 재배 이력을 바탕으로 작성되었습니다" 가이드봇 메시지 분기
- [ ] 상세 폼에 원산지, 인증 내역 등 신규 필드가 추가될 경우 해당 값 자동 할당 (향후)

---

## Phase 8: AI 자연어 상품 검색 (Semantic Search)

> 예상 기간: 1.5일 | 비용: ₩0

### 8-1. AI 서버 검색 쿼리 분석 엔드포인트

- [ ] `ai/app/models/product_assist.py` — 검색 분석 요청/응답 모델 추가 (`SearchQueryRequest`, `SearchQueryResponse`)
- [ ] `ai/app/services/product_assist_service.py` — 자연어 분석 서비스 추가 (`analyze_search_query`)
  - [ ] 자연어 질문(예: "비오는 날 해먹을 거")에서 실질적인 DB 검색 키워드("애호박", "부추") 추출
- [ ] `ai/app/routers/product_assist.py` — `POST /product-assist/search-query` 라우터 추가

### 8-2. Frontend 연동 및 검색 흐름 개선

- [ ] `app/api/ai/product-assist/search/route.ts` — BFF Route Handler
- [ ] `app/(main)/shop/useProductSearch.ts` (또는 페이지 컴포넌트) 검색 로직 수정
  - [ ] 일반 키워드 검색 시 기존 로직 유지
  - [ ] "✨ AI로 찾기" 기능 실행 시 AI 서버로 자연어 전송 → 반환된 키워드로 백엔드 검색 API 호출
- [ ] 로딩 UI ("AI가 알맞은 상품을 찾고 있어요...") 적용
- [ ] 검색 결과 상단에 "💡 AI가 다음 키워드를 기반으로 상품을 찾았어요: [애호박], [부추]" 안내 표시

---

## 최종 점검

- [ ] 모든 AI 호출에 에러 폴백 처리 확인
- [ ] 무료 한도 초과 시 정상 동작 확인
- [ ] 고령 사용자 접근성 (큰 글꼴, 큰 터치 영역) 확인
- [ ] 성능: AI 호출 응답 시간 2초 이내 확인
- [ ] 커밋 및 PR 작성
