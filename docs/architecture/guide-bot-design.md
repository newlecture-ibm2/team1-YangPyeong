# 🧭 AI 가이드 마스코트 설계 문서

> 사용자가 플랫폼 기능을 쉽게 파악할 수 있도록, AI 캐릭터가 페이지를 돌아다니며 말풍선으로 기능을 안내하는 인터랙티브 온보딩 시스템

---

## 1. 기능 개요

### 1.1 문제 정의

- 사용자(특히 고령 농업인)가 처음 방문 시 **어떤 기능이 있는지 파악하기 어려움**
- 기존 해결책(FAQ, 도움말 페이지)은 **사용자가 직접 찾아봐야 함** → 사용률 낮음
- 복잡한 기능(수급 분석, AI 추천 등)이 있지만 **존재 자체를 모르는 경우** 많음

### 1.2 해결 방안

**AI 마스코트 캐릭터**가 화면 위를 자유롭게 이동하며:
1. 각 버튼/메뉴에 도착하면 **말풍선으로 기능 설명**
2. 사용자가 원할 때 **가이드 시작/중지** 가능
3. 2단계에서 **AI 동적 대사** 생성 (사용자 맞춤)

### 1.3 레퍼런스 이미지

```
┌──────────────────────────────────────────────┐
│  FarmBalance    내 농장  수급분석  상점  ...     │
│                                    ↑          │
│                              ┌─────────────┐  │
│                              │ 여기서 양평   │  │
│                              │ 농산물을     │  │
│                              │ 구매해보세요! │  │
│                              └──────┬──────┘  │
│                                👨‍🌾🦆           │
│                           (농부 할아버지 & 오리) │
│                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 상품 1   │  │ 상품 2   │  │ 상품 3   │       │
│  └─────────┘  └─────────┘  └─────────┘       │
└──────────────────────────────────────────────┘
```

---

## 2. 단계별 구현 계획

### 2.1 1단계: 정적 가이드 (프론트엔드만, AI 없음)

- 미리 정의된 시나리오에 따라 캐릭터가 이동 + 말풍선 표시
- **비용: ₩0** (순수 프론트엔드)
- **예상 기간: 2~3일**

### 2.2 2단계: AI 동적 가이드 (무료 LLM 연동)

- 사용자 상황(첫 방문, 재방문, 구매 패턴)에 따라 AI가 대사 동적 생성
- Gemini Flash 무료 (일 1,500회) 또는 Groq 무료 (일 14,400회) 사용
- **비용: ₩0**
- **예상 기간: 1~2일 (1단계 완료 후)**

---

## 3. 기술 설계

### 3.1 컴포넌트 구조

```
frontend/components/common/
└── GuideBot/
    ├── GuideBot.tsx          ← 메인 컴포넌트 (캐릭터 + 말풍선 + 이동 로직)
    ├── GuideBot.module.css   ← 스타일 (캐릭터, 말풍선, 애니메이션)
    ├── guideScenarios.ts     ← 페이지별 가이드 시나리오 데이터
    └── useGuideBot.ts        ← 가이드 상태 관리 Hook
```

### 3.2 가이드 시나리오 데이터 구조

```typescript
interface GuideStep {
  /** 타겟 요소의 CSS 선택자 또는 ID */
  target: string;
  /** 말풍선 텍스트 */
  message: string;
  /** 말풍선 위치 (타겟 기준) */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** 표시 시간 (ms) */
  duration?: number;
}

interface GuideScenario {
  /** 적용 페이지 경로 */
  path: string;
  /** 가이드 스텝 목록 */
  steps: GuideStep[];
}

// 예시
const scenarios: GuideScenario[] = [
  {
    path: '/',
    steps: [
      { target: '#nav-farm', message: '내 농장을 등록하고 관리할 수 있어요! 🌱', position: 'bottom' },
      { target: '#nav-balance', message: '작물 수급 현황을 실시간으로 확인해보세요 📊', position: 'bottom' },
      { target: '#nav-shop', message: '양평 농산물을 직거래로 구매할 수 있어요! 🛒', position: 'bottom' },
      { target: '#nav-recommend', message: 'AI가 최적의 작물을 추천해드려요 🤖', position: 'bottom' },
    ],
  },
  {
    path: '/shop',
    steps: [
      { target: '#search-input', message: '원하는 농산물을 검색해보세요 🔍', position: 'bottom' },
      { target: '#category-tabs', message: '카테고리별로 상품을 볼 수 있어요', position: 'bottom' },
      { target: '#cart-icon', message: '장바구니에 담은 상품을 확인하세요 🛒', position: 'left' },
    ],
  },
  {
    path: '/mypage/seller',
    steps: [
      { target: '#register-btn', message: '새 상품을 등록해보세요! 📦', position: 'bottom' },
      { target: '#orders-link', message: '들어온 주문을 관리할 수 있어요 📋', position: 'bottom' },
    ],
  },
];
```

### 3.3 캐릭터 이동 로직

```typescript
// useGuideBot.ts 핵심 로직

function moveToTarget(target: string) {
  const element = document.querySelector(target);
  if (!element) return;

  // 타겟 요소의 화면상 좌표 계산
  const rect = element.getBoundingClientRect();

  // 캐릭터를 타겟 근처로 부드럽게 이동
  setPosition({
    x: rect.left + rect.width / 2,
    y: rect.top - CHARACTER_HEIGHT - BUBBLE_HEIGHT,
  });

  // 타겟 요소 하이라이트 (주변 dim 처리)
  setHighlightRect(rect);
}
```

### 3.4 캐릭터 디자인 옵션

| 방식 | 장점 | 단점 |
|------|------|------|
| **CSS/SVG 직접 제작** | 가볍고, 커스텀 자유 | 디자인 시간 소요 |
| **Lottie 애니메이션** | 부드러운 움직임, 무료 소스 많음 | 라이브러리 추가 필요 |
| **이모지 기반** | 즉시 적용 가능, 무료 | 다소 단순함 |
| **AI 이미지 생성** | 프로젝트 맞춤 캐릭터 | 1회성 생성 |

**결정 사항**: 프로젝트 마스코트로 **Lottie 애니메이션(농부 할아버지와 따라다니는 노란 오리)**을 채택하여 부드러운 걷기 모션과 친근한 분위기를 연출. (JSON 코드 수정을 통해 모자와 남방 등 농부 테마로 커스텀 적용)

### 3.5 2단계 AI 동적 대사 생성

```typescript
// AI 연동 시 추가되는 부분

interface AiGuideRequest {
  currentPage: string;
  targetElement: string;
  userType: 'first_visit' | 'returning' | 'seller' | 'buyer';
  recentActivity?: string;
}

// 호출 예시
const dynamicMessage = await fetchAiGuide({
  currentPage: '/shop',
  targetElement: '#search-input',
  userType: 'first_visit',
});
// → "처음 오셨군요! 🎉 여기서 양평의 신선한 농산물을 검색해보세요!"

const dynamicMessage2 = await fetchAiGuide({
  currentPage: '/shop',
  targetElement: '#search-input',
  userType: 'returning',
  recentActivity: '상추 구매',
});
// → "다시 오셨네요! 지난번 구매하신 상추, 오늘 새로 입고됐어요 🥬"
```

### 3.6 AI Server 추가 엔드포인트

```python
# ai/app/routers/guide.py

@router.post("/guide/message")
async def generate_guide_message(request: GuideRequest):
    """페이지 컨텍스트에 맞는 가이드 메시지를 생성합니다."""
    service = GuideService()
    return await service.generate(request)
```

```python
# ai/app/services/guide_service.py

class GuideService:
    async def generate(self, request: GuideRequest) -> GuideResponse:
        llm = get_llm()

        prompt = f"""
        당신은 FarmBalance 플랫폼의 친근한 가이드 캐릭터입니다.
        사용자가 현재 [{request.current_page}] 페이지의 [{request.target_element}] 요소를 보고 있습니다.
        사용자 유형: {request.user_type}

        이 요소가 어떤 기능인지 한국어로 친근하게 1~2문장으로 설명해주세요.
        이모지를 적절히 사용하고, 고령 농업인도 이해하기 쉽게 작성하세요.
        """

        message = await llm.generate(prompt)
        return GuideResponse(message=message)
```

### 3.7 무료 LLM 한도 분석

| Provider | 무료 한도 | 가이드 1회 토큰 | 일일 가능 횟수 |
|----------|----------|:-------------:|:------------:|
| **Gemini Flash** | 15 RPM, 일 1,500회 | ~100 토큰 | **1,500회** |
| **Groq** | 30 RPM, 일 14,400회 | ~100 토큰 | **14,400회** |

> 사용자 1명당 평균 5~10회 가이드 → **일 150~2,800명** 대응 가능 (무료)

---

## 4. UX 동작 흐름

```
사용자 첫 방문
    ↓
[캐릭터 등장] 화면 우측 하단에서 팝업
    ↓
"안녕하세요! 👋 이 페이지를 안내해드릴까요?"
    ↓
[가이드 시작] / [다음에 하기] 버튼
    ↓
가이드 시작 시:
  1. 캐릭터가 네비게이션 → 상점 → 농장 순서로 이동
  2. 각 위치에서 말풍선으로 기능 설명
  3. 사용자가 [다음] 클릭하면 다음 스텝으로 이동
  4. 마지막 스텝 → "궁금한 게 있으면 언제든 저를 클릭하세요! 😊"
    ↓
가이드 종료 후:
  캐릭터가 화면 구석에 축소되어 대기
  클릭하면 다시 가이드 시작 or 자유 질문 (2단계)
```

### 4.1 트리거 조건

| 조건 | 동작 |
|------|------|
| 첫 방문 (localStorage 체크) | 자동으로 가이드 시작 제안 |
| 재방문 | 캐릭터 축소 상태로 대기 |
| 특정 페이지 진입 | 해당 페이지 전용 가이드 제공 |
| 캐릭터 클릭 | 현재 페이지 가이드 재시작 |

### 4.2 접근성 고려 (고령 사용자)

- 말풍선 텍스트 최소 **16px** 이상
- 캐릭터 클릭 영역 최소 **48px** 이상
- 이동 속도 **느리게** (0.8s~1.2s 트랜지션)
- **닫기 버튼** 항상 표시 (강제 가이드 방지)
- 가이드 비활성화 옵션 제공

---

## 5. 파일 변경 목록

### 5.1 1단계 (정적 가이드)

| 작업 | 파일 | 설명 |
|------|------|------|
| 신규 | `components/common/GuideBot/GuideBot.tsx` | 메인 컴포넌트 |
| 신규 | `components/common/GuideBot/GuideBot.module.css` | 스타일 |
| 신규 | `components/common/GuideBot/useGuideBot.ts` | 상태 관리 Hook |
| 신규 | `components/common/GuideBot/guideScenarios.ts` | 시나리오 데이터 |
| 수정 | `app/(main)/layout.tsx` | GuideBot 컴포넌트 삽입 |

### 5.2 2단계 (AI 동적 가이드)

| 작업 | 파일 | 설명 |
|------|------|------|
| 신규 | `app/api/ai/guide/route.ts` | BFF Route Handler |
| 신규 | `ai/app/routers/guide.py` | AI 서버 엔드포인트 |
| 신규 | `ai/app/services/guide_service.py` | 가이드 메시지 생성 서비스 |
| 신규 | `ai/app/models/guide.py` | Request/Response 스키마 |
| 수정 | `components/common/GuideBot/useGuideBot.ts` | AI 호출 로직 추가 |
