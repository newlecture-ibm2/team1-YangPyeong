우# 🤖 가이드봇 챗봇 기능 추가 구현 가이드

> 기존 할아버지 캐릭터(FarmBot)에 AI 챗봇 대화 기능을 추가합니다.
> 이 문서는 코드 수정의 정확한 위치와 내용을 포함하고 있어, 그대로 따라하면 구현이 완료됩니다.

---

## 현재 인프라 상태 (수정 불필요)

| 항목 | 파일 | 상태 |
|------|------|:---:|
| AI 챗봇 라우터 | `ai/app/routers/chat.py` | ✅ `POST /api/chat` 완성 |
| LLM 팩토리 | `ai/app/llm/__init__.py` | ✅ `get_llm("groq")` 지원 |
| Docker AI 서버 | `docker-compose.yml` | ✅ `AI_SERVER_URL=http://ai-server:8000` |
| 가이드봇 컴포넌트 | `frontend/components/common/FarmBot/` | ✅ v7 완성 |

---

## 작업 순서 (총 5단계)

---

### 1단계: BFF Route Handler 생성

**새 파일**: `frontend/app/api/ai/chat/route.ts`

> 프론트엔드 → AI 서버로 챗봇 요청을 프록시합니다.
> 기존 `frontend/app/api/ai/product-assist/route.ts` 패턴을 참고하세요.

```typescript
/**
 * BFF Route Handler: AI 챗봇
 * POST /api/ai/chat
 * Frontend → 이 Route Handler → AI 서버 (farm-ai:8000)
 */
import { NextRequest, NextResponse } from 'next/server';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: 'E-CHAT-001', message: '메시지를 입력해주세요.' } },
        { status: 400 },
      );
    }

    // AI 서버의 chat.py 엔드포인트 호출
    // chat.py가 기대하는 스키마: { userId, roomId, category, message, metadata? }
    const aiResponse = await fetch(`${AI_SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: body.userId || 0,
        roomId: body.roomId || 0,
        category: 'general',
        message: message,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'E-CHAT-002', message: 'AI 서버 요청 실패' } },
        { status: aiResponse.status },
      );
    }

    // chat.py 응답 스키마: { reply: string }
    const data = await aiResponse.json();

    return NextResponse.json({
      success: true,
      data: { reply: data.reply },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'AI 챗봇 오류';
    return NextResponse.json(
      { success: false, error: { code: 'E-CHAT-999', message: msg } },
      { status: 500 },
    );
  }
}
```

---

### 2단계: useFarmBot.ts 수정

**파일**: `frontend/components/common/FarmBot/useFarmBot.ts`

#### 2-1. GuideMode 타입에 `'chatting'` 추가 (18번 라인)

```diff
-export type GuideMode = 'minimized' | 'asking' | 'guiding' | 'hidden';
+export type GuideMode = 'minimized' | 'asking' | 'guiding' | 'hidden' | 'chatting';
```

#### 2-2. 채팅 관련 상태 추가 (44번 라인 뒤에 삽입)

```typescript
  // ── 채팅 상태 ──
  interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
```

> 주의: `ChatMessage` 인터페이스는 useFarmBot 함수 내부 또는 파일 상단에 선언합니다.
> 파일 상단(export 영역)에 선언하는 것을 권장합니다:

```typescript
// 15번 라인 근처, BotState 아래에 추가
export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}
```

#### 2-3. 채팅 함수 추가 (restartGuide 함수 뒤, 약 240번 라인 뒤에 삽입)

```typescript
  /** 채팅 모드 시작 */
  const startChat = useCallback(() => {
    setMode('chatting');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    // 첫 진입 시 환영 메시지
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'bot',
        content: '안녕하세요! 🌱 양평 농업에 대해 무엇이든 물어보세요!',
      }]);
    }
  }, [chatMessages.length]);

  /** 메시지 전송 */
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: message.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();

      const botReply: ChatMessage = {
        role: 'bot',
        content: data.success
          ? data.data.reply
          : '죄송합니다. 일시적인 오류가 발생했어요. 다시 시도해주세요.',
      };
      setChatMessages(prev => [...prev, botReply]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading]);

  /** 채팅 종료 */
  const closeChat = useCallback(() => {
    setMode('minimized');
  }, []);
```

#### 2-4. return 객체에 채팅 관련 값 추가 (280번 라인 근처)

```diff
  return {
    isMounted,
    mode,
    currentStep,
    totalSteps: steps.length,
    botState,
    position,
    facingRight,
    showBubble,
    bubbleMessage,
    bubbleAbove,
    highlightRect,
    hasScenario: steps.length > 0,
    nextStep,
    prevStep,
    stopGuide,
    restartGuide,
    acceptGuide,
    declineGuide,
    showQuickMessage,
    hideBot,
    showBot,
+   // 채팅
+   startChat,
+   closeChat,
+   sendChatMessage,
+   chatMessages,
+   chatInput,
+   setChatInput,
+   chatLoading,
  };
```

#### 2-5. 스크롤 잠금 조건에 chatting 추가 (258번 라인 근처)

```diff
  useEffect(() => {
-   if (mode === 'guiding' || mode === 'asking') {
+   if (mode === 'guiding' || mode === 'asking' || mode === 'chatting') {
      document.body.style.overflow = 'hidden';
    } else {
```

> **중요**: 스크롤 잠금은 채팅 모드에서는 오히려 불편할 수 있습니다. 채팅 모드에서는 잠금하지 않도록 하려면 이 변경을 건너뛰세요.

---

### 3단계: FarmBot.tsx 수정

**파일**: `frontend/components/common/FarmBot/FarmBot.tsx`

#### 3-1. useFarmBot 훅에서 채팅 관련 값 destructure (82번 라인 근처)

기존 destructure 블록에 다음을 추가:

```diff
  const {
    mode,
    currentStep,
    totalSteps,
    botState,
    position,
    facingRight,
    showBubble,
    bubbleMessage,
    bubbleAbove,
    highlightRect,
    hasScenario,
    nextStep,
    prevStep,
    stopGuide,
    restartGuide,
    acceptGuide,
    declineGuide,
    showQuickMessage,
    hideBot,
    showBot,
    isMounted,
+   startChat,
+   closeChat,
+   sendChatMessage,
+   chatMessages,
+   chatInput,
+   setChatInput,
+   chatLoading,
  } = useFarmBot();
```

#### 3-2. useRef 추가 (import 블록 근처, 10번 라인)

```diff
-import { ReactNode, useEffect, useState } from 'react';
+import { ReactNode, useEffect, useState, useRef } from 'react';
```

#### 3-3. 채팅 스크롤 ref 추가 (useFarmBot 호출 직후)

```typescript
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지 올 때 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
```

#### 3-4. 축소 모드 툴팁에 "질문하기" 버튼 추가 (186~196번 라인 근처)

기존 축소 모드의 툴팁 버튼 영역에 "💬 질문하기" 버튼을 추가합니다.
기존의 `tooltipBtns` span 안에 추가:

```tsx
<span className={styles.tooltipBtns}>
  <span
    role="button"
    tabIndex={0}
    className={styles.tooltipGuideBtn}
    onClick={(e) => { e.stopPropagation(); restartGuide(); }}
    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); restartGuide(); } }}
  >
    🌱 가이드 시작
  </span>
  {/* ── 새로 추가: 채팅 버튼 ── */}
  <span
    role="button"
    tabIndex={0}
    className={styles.tooltipChatBtn}
    onClick={(e) => { e.stopPropagation(); startChat(); }}
    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); startChat(); } }}
  >
    💬 질문하기
  </span>
  <span
    role="button"
    tabIndex={0}
    className={styles.tooltipHideBtn}
    onClick={(e) => { e.stopPropagation(); hideBot(); }}
    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); hideBot(); } }}
  >
    숨기기
  </span>
</span>
```

#### 3-5. 채팅 모드 렌더링 추가 (mode === 'asking' 분기 바로 위, 약 212번 라인)

`if (mode === 'asking')` 블록 위에 다음 블록을 삽입합니다:

```tsx
  // ── 채팅 모드 ──
  if (mode === 'chatting') {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage }}>
        {children}
        <div className={styles.chatOverlay}>
          <div className={styles.chatContainer}>
            {/* 헤더 */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <Image src="/icon.png" alt="가이드봇" width={32} height={32} className={styles.chatAvatar} />
                <span className={styles.chatTitle}>양평이 할아버지</span>
              </div>
              <button className={styles.chatCloseBtn} onClick={closeChat} aria-label="채팅 닫기">✕</button>
            </div>

            {/* 메시지 목록 */}
            <div className={styles.chatMessages}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgBot}`}
                >
                  {msg.role === 'bot' && (
                    <Image src="/icon.png" alt="" width={28} height={28} className={styles.chatMsgAvatar} />
                  )}
                  <div className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className={`${styles.chatMsg} ${styles.chatMsgBot}`}>
                  <Image src="/icon.png" alt="" width={28} height={28} className={styles.chatMsgAvatar} />
                  <div className={`${styles.chatBubble} ${styles.chatBubbleBot}`}>
                    <span className={styles.chatTyping}>답변 작성 중...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 입력창 */}
            <form
              className={styles.chatInputArea}
              onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }}
            >
              <input
                type="text"
                className={styles.chatInputField}
                placeholder="궁금한 것을 물어보세요..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                autoFocus
              />
              <button
                type="submit"
                className={styles.chatSendBtn}
                disabled={chatLoading || !chatInput.trim()}
              >
                전송
              </button>
            </form>
          </div>
        </div>
      </FarmBotContext.Provider>
    );
  }
```

---

### 4단계: FarmBot.module.css에 채팅 스타일 추가

**파일**: `frontend/components/common/FarmBot/FarmBot.module.css`

파일 맨 끝에 다음 CSS를 추가합니다:

```css
/* ═══════════════════════════════════════
   채팅 모드 스타일
   ═══════════════════════════════════════ */

/* 채팅 오버레이 (반투명 배경) */
.chatOverlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
}

/* 채팅 컨테이너 */
.chatContainer {
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: chatSlideUp 0.3s ease-out;
}

@keyframes chatSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 헤더 */
.chatHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #2d7d46;
  color: #fff;
}

.chatHeaderLeft {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chatAvatar {
  border-radius: 50%;
  background: #fff;
}

.chatTitle {
  font-size: 15px;
  font-weight: 700;
}

.chatCloseBtn {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.chatCloseBtn:hover {
  background: rgba(255,255,255,0.2);
}

/* 메시지 영역 */
.chatMessages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f5f5f0;
}

/* 메시지 행 */
.chatMsg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chatMsgUser {
  justify-content: flex-end;
}

.chatMsgBot {
  justify-content: flex-start;
}

.chatMsgAvatar {
  border-radius: 50%;
  flex-shrink: 0;
}

/* 말풍선 */
.chatBubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.chatBubbleUser {
  background: #2d7d46;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chatBubbleBot {
  background: #fff;
  color: #333;
  border: 1px solid #e0e0d8;
  border-bottom-left-radius: 4px;
}

/* 로딩 애니메이션 */
.chatTyping {
  color: #888;
  font-style: italic;
}

/* 입력 영역 */
.chatInputArea {
  display: flex;
  padding: 12px;
  gap: 8px;
  border-top: 1px solid #e5e5e0;
  background: #fff;
}

.chatInputField {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.chatInputField:focus {
  border-color: #2d7d46;
}

.chatSendBtn {
  padding: 10px 18px;
  background: #2d7d46;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.chatSendBtn:hover:not(:disabled) {
  background: #236635;
}

.chatSendBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 축소모드 질문하기 버튼 */
.tooltipChatBtn {
  display: inline-block;
  padding: 6px 14px;
  background: #fff;
  border: 1.5px solid #2d7d46;
  color: #2d7d46;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.tooltipChatBtn:hover {
  background: #2d7d46;
  color: #fff;
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .chatOverlay {
    padding: 0;
  }
  .chatContainer {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}
```

---

### 5단계: FarmBotContext.ts 수정 (선택 사항)

**파일**: `frontend/components/common/FarmBot/FarmBotContext.ts`

외부 컴포넌트에서 채팅 모드를 열 수 있도록 Context에 `startChat`을 추가합니다.

```diff
 interface FarmBotContextValue {
   showQuickMessage: (message: string, durationMs?: number) => void;
+  startChat?: () => void;
 }

 export const FarmBotContext = createContext<FarmBotContextValue>({
   showQuickMessage: () => {},
+  startChat: () => {},
 });
```

그리고 `FarmBot.tsx`의 모든 `<FarmBotContext.Provider>` value에 `startChat`을 추가합니다:

```diff
-<FarmBotContext.Provider value={{ showQuickMessage }}>
+<FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
```

---

## 6단계: AI 서버 — 할아버지 페르소나 적용

**파일**: `ai/app/routers/chat.py`

할아버지 캐릭터와 연결된 느낌을 주기 위해 **시스템 프롬프트를 할아버지 말투로 변경**합니다.

#### 55~58번 라인의 `system_instruction` 수정

```diff
-        system_instruction = (
-            "당신은 양평군 농업인을 위한 친절한 AI 상담사입니다. "
-            "작물 재배, 농업 정책, 수급 현황에 대해 쉽고 정확하게 답변합니다. "
-            "고령 농업인도 이해할 수 있도록 쉬운 용어를 사용합니다."
-        )
+        system_instruction = (
+            "당신은 '양평이 할아버지'입니다. 양평군에서 40년째 농사를 짓고 있는 베테랑 농부예요. "
+            "친근하고 따뜻한 말투로 답변하세요. 존댓말을 기본으로 쓰되 가끔 '~해요', '~거든요' 같은 구어체를 섞어주세요. "
+            "작물 재배, 농업 정책, 수급 현황에 대해 경험담을 곁들여 쉽고 정확하게 답변합니다. "
+            "이모지를 적절히 사용하고, 고령 농업인도 이해하기 쉽게 작성하세요. "
+            "예시 말투: '고추는 말이에요, 5월 초쯤 심으면 딱 좋거든요~ 🌶️ 저도 매년 그때쯤 정식한답니다!'"
+        )
```

> **포인트**: 이 한 줄만 바꾸면 모든 AI 응답이 할아버지 캐릭터의 말투로 나옵니다.
> AI 서버의 다른 코드는 수정할 필요 없습니다.

---

## 7단계: 로딩 문구 할아버지 캐릭터화

**파일**: `frontend/components/common/FarmBot/FarmBot.tsx`

3단계에서 추가한 채팅 모드 렌더링 코드 중, 로딩 표시 부분을 수정합니다:

```diff
-  <span className={styles.chatTyping}>답변 작성 중...</span>
+  <span className={styles.chatTyping}>할아버지가 생각 중... 🤔</span>
```

환영 메시지도 할아버지 말투로 수정합니다 (`useFarmBot.ts`의 `startChat` 함수):

```diff
-  content: '안녕하세요! 🌱 양평 농업에 대해 무엇이든 물어보세요!',
+  content: '어서 오세요! 🌱 양평 농사에 대해 궁금한 거 있으면 편하게 물어보세요~ 뭐든 알려드릴게요!',
```

---

## 수정 파일 최종 요약

| # | 작업 | 파일 경로 |
|:-:|:---:|------|
| 1 | **신규** | `frontend/app/api/ai/chat/route.ts` |
| 2 | **수정** | `frontend/components/common/FarmBot/useFarmBot.ts` |
| 3 | **수정** | `frontend/components/common/FarmBot/FarmBot.tsx` |
| 4 | **수정** | `frontend/components/common/FarmBot/FarmBot.module.css` |
| 5 | **수정** | `frontend/components/common/FarmBot/FarmBotContext.ts` |
| 6 | **수정** | `ai/app/routers/chat.py` |

---

## AI 서버 chat.py 엔드포인트 스펙 (수정 불필요, 참고용)

```
POST http://ai-server:8000/api/chat

Request Body:
{
  "userId": 0,
  "roomId": 0,
  "category": "general",
  "message": "고추 심기 좋은 시기가 언제야?"
}

Response Body:
{
  "reply": "고추는 보통 5월 초에 정식하는 것이 좋습니다..."
}
```

---

## 테스트 방법

1. `docker compose up -d --build` (전체 재빌드)
2. `http://localhost:3131` 접속
3. 하단의 할아버지 캐릭터 클릭 → "💬 질문하기" 버튼 클릭
4. 채팅창에서 "양평에서 재배하기 좋은 작물이 뭐야?" 입력 → 전송
5. AI 응답이 말풍선으로 표시되는지 확인
6. X 버튼 클릭 → 축소 모드로 돌아가는지 확인
