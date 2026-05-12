# 🧓 챗봇 전체 구현 가이드 (v3 — 원스톱)

> git restore로 원래 상태로 돌아갔으므로, 처음부터 끝까지 모든 작업을 포함합니다.
> 총 6단계, 순서대로 진행하세요.

---

## 1단계: 모델명 오타 수정

### [MODIFY] `docker-compose.yml` (87번 라인)

현재:
```yaml
      - GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}
```

변경:
```yaml
      - GEMINI_MODEL=${GEMINI_MODEL:-gemini-1.5-flash}
```

---

## 2단계: useFarmBot.ts — 채팅 상태 추가

### 2-1. ChatMessage 인터페이스 + GuideMode 확장 (15~18번 라인)

현재:
```typescript
export type BotState = 'idle' | 'walking' | 'pointing' | 'waving';

/** 가이드 진행 모드 (향후 'chat' 추가 예정) */
export type GuideMode = 'minimized' | 'asking' | 'guiding' | 'hidden';
```

변경:
```typescript
export type BotState = 'idle' | 'walking' | 'pointing' | 'waving';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

/** 가이드 진행 모드 */
export type GuideMode = 'minimized' | 'asking' | 'guiding' | 'hidden' | 'chatting';
```

### 2-2. 채팅 상태 변수 추가 (45번 라인 뒤, `bubbleAbove` 다음)

다음 코드를 `const [bubbleAbove, setBubbleAbove] = useState(true);` 바로 다음에 삽입:

```typescript
  // ── 채팅 상태 ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
```

### 2-3. 채팅 함수 추가 (restartGuide 함수 다음에 삽입)

`restartGuide` 함수 바로 뒤에 다음 코드를 삽입:

```typescript
  /** 채팅 모드 시작 */
  const startChat = useCallback(() => {
    setMode('chatting');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'bot',
        content: '허허, 어서 와요~ 👋\n양평 농사에 대해 궁금한 게 있으면 편하게 물어봐요!\n아래 버튼을 눌러도 되고, 직접 입력해도 된답니다~ 🌱',
      }]);
    }
  }, [chatMessages.length]);

  /** 메시지 전송 (대화 히스토리 포함) */
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: message.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    // 최근 10턴만 히스토리로 전송
    const history = updatedMessages.slice(-10).map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.content,
    }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), history }),
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
  }, [chatLoading, chatMessages]);

  /** 채팅 종료 */
  const closeChat = useCallback(() => {
    setMode('minimized');
  }, []);

  /** 채팅 초기화 */
  const resetChat = useCallback(() => {
    setChatMessages([{
      role: 'bot',
      content: '허허, 새로 시작하자고요? 좋아요~ 👋\n뭐든 물어봐요! 🌱',
    }]);
    setChatInput('');
  }, []);
```

### 2-4. 스크롤 잠금에 chatting 추가 (mode === 'guiding' 부분)

현재:
```typescript
    if (mode === 'guiding' || mode === 'asking') {
```

변경:
```typescript
    if (mode === 'guiding' || mode === 'asking' || mode === 'chatting') {
```

### 2-5. return 객체에 채팅 관련 추가 (showBot 다음)

현재:
```typescript
    showBot,
  };
}
```

변경:
```typescript
    showBot,
    // 채팅
    startChat,
    closeChat,
    sendChatMessage,
    resetChat,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
  };
}
```

---

## 3단계: FarmBotContext.ts — startChat 추가

### [MODIFY] `FarmBotContext.ts` (전체 교체)

현재 파일 전체를 아래로 교체:

```typescript
/* ════════════════════════════════════════════════════════
   FarmBot Context — 외부 컴포넌트에서 팜봇 메시지를 트리거
   사용법: const { showQuickMessage } = useFarmBotContext();
   ════════════════════════════════════════════════════════ */

'use client';

import { createContext, useContext } from 'react';

interface FarmBotContextValue {
  /** 팜봇이 잠시 말풍선을 보여줍니다 (자동 사라짐) */
  showQuickMessage: (message: string, durationMs?: number) => void;
  /** 채팅 모드를 시작합니다 */
  startChat: () => void;
}

export const FarmBotContext = createContext<FarmBotContextValue>({
  showQuickMessage: () => {},
  startChat: () => {},
});

/** 외부 컴포넌트에서 팜봇 메시지를 트리거할 때 사용 */
export function useFarmBotContext() {
  return useContext(FarmBotContext);
}
```

---

## 4단계: FarmBot.tsx — 채팅 UI 추가

### 4-1. import 수정 (10번 라인)

현재:
```tsx
import { ReactNode, useEffect, useState } from 'react';
```

변경:
```tsx
import { ReactNode, useEffect, useState, useRef } from 'react';
```

### 4-2. useFarmBot 디스트럭처링에 채팅 추가 (82~104번 라인)

현재:
```tsx
    showBot,
    isMounted,
  } = useFarmBot();
```

변경:
```tsx
    showBot,
    isMounted,
    startChat,
    closeChat,
    sendChatMessage,
    resetChat,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
  } = useFarmBot();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'chatting') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mode]);
```

### 4-3. 모든 FarmBotContext.Provider value 수정

파일 내 모든 `value={{ showQuickMessage }}`를 `value={{ showQuickMessage, startChat }}`로 교체합니다. (약 6~7군데)

### 4-4. 축소 모드 툴팁에 질문하기 버튼 추가

축소 모드의 tooltipGuideBtn 다음에 추가:

```tsx
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.tooltipChatBtn}
                    onClick={(e) => { e.stopPropagation(); startChat(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); startChat(); } }}
                  >
                    💬 질문하기
                  </span>
```

### 4-5. 채팅 모드 렌더링 추가

`if (mode === 'asking')` 블록 바로 **위**에 다음 블록을 삽입:

```tsx
  // ── 채팅 모드 ──
  if (mode === 'chatting') {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
        <div className={styles.chatOverlay}>
          <div className={styles.chatContainer}>
            {/* 헤더 */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.chatHeaderLottie}>
                  {lottieData && (
                    <Lottie animationData={lottieData} loop autoplay className={styles.chatHeaderLottieAnim} />
                  )}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatTitle}>양평이 할아버지</span>
                  <span className={styles.chatSubtitle}>양평군 40년차 베테랑 농부 🌾</span>
                </div>
              </div>
              <div className={styles.chatHeaderBtns}>
                <button className={styles.chatResetBtn} onClick={resetChat} aria-label="대화 초기화" title="새 대화">🔄</button>
                <button className={styles.chatCloseBtn} onClick={closeChat} aria-label="채팅 닫기">✕</button>
              </div>
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
                    <span className={styles.chatTyping}>할아버지가 생각 중... 🤔</span>
                  </div>
                </div>
              )}
              {/* 빠른 질문 버튼 */}
              {chatMessages.length <= 1 && !chatLoading && (
                <div className={styles.quickQuestions}>
                  {[
                    { emoji: '🌶️', text: '요즘 뭐 심으면 좋아요?' },
                    { emoji: '💰', text: '농업 보조금 정보 알려줘요' },
                    { emoji: '🌱', text: '초보 농부인데 뭐부터 해야 해요?' },
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      className={styles.quickQuestionBtn}
                      onClick={() => sendChatMessage(`${q.emoji} ${q.text}`)}
                    >
                      <span className={styles.quickQuestionEmoji}>{q.emoji}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
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

## 5단계: FarmBot.module.css — 채팅 스타일

파일 끝(`@keyframes restore-bounce` 닫는 중괄호 다음)에 아래 CSS를 추가:

```css
/* ═══ 채팅 모드 ═══ */
.chatOverlay { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: flex-end; justify-content: flex-end; padding: 20px; background: rgba(0,0,0,0.2); }
.chatContainer { width: 380px; height: 520px; background: #fff; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden; animation: chatSlideUp 0.3s ease-out; }
@keyframes chatSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

.chatHeader { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, #4a8c5c 0%, #2d6a3e 100%); color: #fff; }
.chatHeaderLeft { display: flex; align-items: center; gap: 10px; }
.chatHeaderLottie { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.2); overflow: hidden; flex-shrink: 0; }
.chatHeaderLottieAnim { width: 48px; height: 48px; }
.chatHeaderInfo { display: flex; flex-direction: column; }
.chatTitle { font-size: 15px; font-weight: 700; }
.chatSubtitle { font-size: 11px; opacity: 0.85; margin-top: 2px; }
.chatHeaderBtns { display: flex; gap: 4px; }
.chatResetBtn { background: none; border: none; color: #fff; font-size: 16px; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.15s; }
.chatResetBtn:hover { background: rgba(255,255,255,0.2); }
.chatCloseBtn { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.15s; }
.chatCloseBtn:hover { background: rgba(255,255,255,0.2); }

.chatMessages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #faf8f4; }
.chatMsg { display: flex; align-items: flex-end; gap: 8px; }
.chatMsgUser { justify-content: flex-end; }
.chatMsgBot { justify-content: flex-start; }
.chatMsgAvatar { border-radius: 50%; flex-shrink: 0; }
.chatBubble { max-width: 75%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; white-space: pre-wrap; }
.chatBubbleUser { background: #2d7d46; color: #fff; border-bottom-right-radius: 4px; }
.chatBubbleBot { background: #fff9f0; color: #333; border: 1px solid #e8ddd0; border-bottom-left-radius: 4px; }
.chatTyping { color: #888; font-style: italic; }

.chatInputArea { display: flex; padding: 12px; gap: 8px; border-top: 1px solid #e5e5e0; background: #fff; }
.chatInputField { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none; transition: border-color 0.15s; }
.chatInputField:focus { border-color: #2d7d46; }
.chatSendBtn { padding: 10px 18px; background: #2d7d46; color: #fff; border: none; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.chatSendBtn:hover:not(:disabled) { background: #236635; }
.chatSendBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.tooltipChatBtn { display: inline-block; padding: 6px 14px; background: #fff; border: 1.5px solid #2d7d46; color: #2d7d46; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.tooltipChatBtn:hover { background: #2d7d46; color: #fff; }

.quickQuestions { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.quickQuestionBtn { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fff; border: 1.5px solid #d4c9b8; border-radius: 12px; font-size: 13px; color: #5a4e3c; cursor: pointer; text-align: left; transition: all 0.15s; }
.quickQuestionBtn:hover { background: #fff9f0; border-color: #2d7d46; color: #2d7d46; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(45,125,70,0.12); }
.quickQuestionEmoji { font-size: 18px; flex-shrink: 0; }

@media (max-width: 480px) {
  .chatOverlay { padding: 0; }
  .chatContainer { width: 100%; height: 100%; border-radius: 0; }
}
```

---

## 6단계: chat.py — 할아버지 페르소나 + 대화 히스토리

### [MODIFY] `ai/app/routers/chat.py` (전체 교체)

```python
"""
챗봇 라우터.
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["chat"])
logger = logging.getLogger(__name__)


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    userId: int = 0
    roomId: int = 0
    category: str = "general"
    message: str
    metadata: Optional[dict] = None
    history: Optional[list[HistoryItem]] = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    logger.info("챗봇 요청 수신 [userId=%s, category=%s]", request.userId, request.category)

    try:
        from app.llm import get_llm

        try:
            llm = get_llm("groq")
        except Exception:
            logger.warning("Groq 사용 불가, 기본 Provider로 대체합니다.")
            llm = get_llm()

        system_instruction = (
            "## 캐릭터\n"
            "당신은 '양평이 할아버지'입니다.\n"
            "- 나이: 68세, 양평군 양서면에서 40년째 농사\n"
            "- 성격: 말이 많고, 옆길로 잘 새고, 자기 경험담을 꼭 끼워넣음\n\n"
            "## 말투 규칙\n"
            "- 반말과 존댓말을 자연스럽게 섞어 씁니다\n"
            "- 입버릇: '허허', '그거 말이야~', '우리 때는 말이지'\n"
            "- 이모지를 가끔 씁니다 (핵심 포인트에만)\n\n"
            "## 답변 규칙\n"
            "- 답변은 3~5문장으로 짧게. 대화체로만 답하세요\n"
            "- 경험담을 한 줄 넣으세요\n"
            "- 모르는 건 솔직히 모른다고 하세요\n"
            "- 절대 목록이나 번호 매기기를 하지 마세요\n"
            "- 상대를 '젊은이', '아이고' 같은 표현으로 부르세요\n"
        )

        # 대화 히스토리를 프롬프트에 포함
        prompt_parts = []
        if request.history:
            prompt_parts.append("[이전 대화]")
            for h in request.history[:-1]:  # 마지막(현재 질문) 제외
                role_label = "사용자" if h.role == "user" else "할아버지"
                prompt_parts.append(f"{role_label}: {h.content}")
            prompt_parts.append("")

        prompt_parts.append(f"[현재 질문]\n사용자: {request.message}")
        full_prompt = "\n".join(prompt_parts)

        reply = await llm.generate(
            prompt=full_prompt,
            system_instruction=system_instruction,
            temperature=0.85,
            max_tokens=512,
        )

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error("챗봇 응답 생성 실패: %s", e)
        return ChatResponse(reply="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
```

---

## 7단계: BFF Route — 히스토리 전달

### [MODIFY] `frontend/app/api/ai/chat/route.ts` (29~34번 라인)

현재:
```typescript
      body: JSON.stringify({
        userId: body.userId || 0,
        roomId: body.roomId || 0,
        category: 'general',
        message: message,
      }),
```

변경:
```typescript
      body: JSON.stringify({
        userId: body.userId || 0,
        roomId: body.roomId || 0,
        category: 'general',
        message: message,
        history: body.history || [],
      }),
```

---

## 적용 후 확인

```bash
docker compose up -d --build ai-server frontend
```

1. 할아버지 클릭 → "💬 질문하기" → 채팅창 열림
2. 빠른 질문 버튼 클릭 → 할아버지 말투로 답변 (잘리지 않음)
3. 후속 질문 → 이전 대화 맥락 유지 확인
4. 🔄 버튼 → 대화 초기화 확인
