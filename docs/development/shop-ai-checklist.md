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

- [ ] `ai/app/models/product_assist.py` — 요청/응답 모델
- [ ] `ai/app/services/product_assist_service.py` — 상품 설명 생성 서비스
  - [ ] 프롬프트: 상품명 + 카테고리 → 양평군 특화 매력적 설명 생성
  - [ ] 출력 길이 제한 (500자 이내)
- [ ] `ai/app/routers/product_assist.py` — `POST /product-assist/description`

### 3-2. Frontend 연동

- [ ] `app/api/ai/product-assist/route.ts` — BFF Route Handler
- [ ] `app/(main)/mypage/seller/register/page.tsx` 수정
  - [ ] "✨ AI 설명 생성" 버튼 추가 (설명 textarea 상단)
  - [ ] 버튼 클릭 → API 호출 → 생성된 설명을 textarea에 자동 채움
  - [ ] 로딩 상태 표시 (스피너 + "AI가 설명을 작성하고 있어요...")
  - [ ] 기존 설명이 있을 경우 "덮어쓰기 확인" 모달
- [ ] `app/(main)/mypage/seller/[productId]/edit/page.tsx`에도 동일 적용

### 3-3. 테스트

- [ ] 상품명+카테고리 입력 → AI 설명 생성 확인
- [ ] 생성된 설명 수정 가능 확인
- [ ] AI 서버 오류 시 에러 메시지 표시 확인

---

## Phase 4: AI 카테고리 자동 추천

> 예상 기간: 0.5일 | 비용: ₩0

### 4-1. AI 서버 카테고리 추천

- [ ] `product_assist_service.py`에 카테고리 추천 메서드 추가
  - [ ] DB 카테고리 목록을 컨텍스트로 전달 → 상품명에 맞는 카테고리 반환
- [ ] `product_assist.py`에 `POST /product-assist/category` 추가

### 4-2. Frontend 연동

- [ ] 상품명 입력 blur 이벤트 → 카테고리 추천 API 호출
- [ ] 추천 결과를 드롭다운에 자동 선택 + "🤖 AI 추천" 뱃지 표시
- [ ] 판매자가 수동으로 변경 가능 (추천 무시 가능)

### 4-3. 테스트

- [ ] 다양한 상품명으로 카테고리 추천 정확도 확인
- [ ] 수동 변경 후 AI 뱃지 제거 확인

---

## Phase 5: AI 적정 가격 추천

> 예상 기간: 1일 | 비용: ₩0

### 5-1. 가격 데이터 수집 로직

- [ ] 같은 카테고리 상품들의 가격 통계 쿼리 (avg, min, max)
- [ ] `product_assist_service.py`에 가격 범위 계산 메서드 추가
- [ ] `product_assist.py`에 `POST /product-assist/price` 추가

### 5-2. Frontend 연동

- [ ] 가격 입력란 하단에 `💡 이 카테고리 시세: ₩7,000~₩9,000` 힌트 표시
- [ ] 카테고리 변경 시 자동 갱신
- [ ] 데이터 부족 시 (상품 3개 미만) 힌트 미표시

### 5-3. 테스트

- [ ] 각 카테고리별 가격 범위 정상 표시 확인
- [ ] 상품 0개 카테고리 → 힌트 숨김 확인

---

## Phase 6: 판매자 인사이트 (선택)

> 예상 기간: 2일 | 비용: ₩0

### 6-1. 인사이트 생성

- [ ] 판매자 주문 데이터 집계 (인기 상품, 주문 추세, 재고 예측)
- [ ] AI가 집계 데이터를 자연어 인사이트로 변환
- [ ] `POST /product-assist/insight` 엔드포인트

### 6-2. Frontend 연동

- [ ] 판매자 대시보드 상단에 "🤖 AI 인사이트" 카드 추가
- [ ] 매일 1회 갱신 (또는 대시보드 진입 시)

---

## 최종 점검

- [ ] 모든 AI 호출에 에러 폴백 처리 확인
- [ ] 무료 한도 초과 시 정상 동작 확인
- [ ] 고령 사용자 접근성 (큰 글꼴, 큰 터치 영역) 확인
- [ ] 성능: AI 호출 응답 시간 2초 이내 확인
- [ ] 커밋 및 PR 작성
