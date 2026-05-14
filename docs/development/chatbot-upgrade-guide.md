# 🧓 가이드봇 챗봇 개선 가이드 (v2)

> 현재 챗봇이 "할아버지인 척하는 상담원" 느낌인 문제를 해결합니다.
> 3가지 개선을 **순서대로 하나씩** 진행합니다.

---

## 개선 1: 채팅창에 할아버지 캐릭터 살리기

> **문제**: 채팅 모드 진입 시 Lottie 할아버지가 완전히 사라져서 캐릭터 느낌이 없음
> **목표**: 채팅창 헤더에 움직이는 Lottie 할아버지를 넣고, 전체 색감을 따뜻하게 변경

### 수정 파일

| 파일 | 변경 |
|------|------|
| `frontend/components/common/FarmBot/FarmBot.tsx` | 채팅 헤더에 Lottie 캐릭터 추가 |
| `frontend/components/common/FarmBot/FarmBot.module.css` | 헤더 레이아웃·색상 변경 |

### FarmBot.tsx — 채팅 모드 헤더 수정 (238~252번 라인 근처)

현재 코드:
```tsx
{/* 헤더 */}
<div className={styles.chatHeader}>
  <div className={styles.chatHeaderLeft}>
    <Image src="/icon.png" alt="가이드봇" width={32} height={32} className={styles.chatAvatar} />
    <span className={styles.chatTitle}>양평이 할아버지</span>
  </div>
  <button className={styles.chatCloseBtn} onClick={closeChat} aria-label="채팅 닫기">✕</button>
</div>
```

변경 코드:
```tsx
{/* 헤더 — 할아버지 Lottie 캐릭터 포함 */}
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
  <button className={styles.chatCloseBtn} onClick={closeChat} aria-label="채팅 닫기">✕</button>
</div>
```

### FarmBot.module.css — 헤더 스타일 변경

**기존 `.chatHeader` 관련 스타일(670~693번 라인)을 아래로 교체:**

```css
/* 헤더 — 따뜻한 색감 + 할아버지 캐릭터 */
.chatHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #4a8c5c 0%, #2d6a3e 100%);
  color: #fff;
  border-bottom: 2px solid #23553180;
}

.chatHeaderLeft {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chatHeaderLottie {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  overflow: hidden;
  flex-shrink: 0;
}

.chatHeaderLottieAnim {
  width: 48px;
  height: 48px;
}

.chatHeaderInfo {
  display: flex;
  flex-direction: column;
}

.chatTitle {
  font-size: 15px;
  font-weight: 700;
}

.chatSubtitle {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}
```

**기존 `.chatAvatar` 스타일은 삭제합니다** (더 이상 사용하지 않음).

**메시지 영역 배경도 따뜻하게 변경 (`.chatMessages` 스타일):**

```css
.chatMessages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #faf8f4;  /* 변경: 차가운 회색 → 따뜻한 베이지 */
}
```

**봇 말풍선도 따뜻하게 변경 (`.chatBubbleBot` 스타일):**

```css
.chatBubbleBot {
  background: #fff9f0;  /* 변경: 순백 → 따뜻한 아이보리 */
  color: #333;
  border: 1px solid #e8ddd0;  /* 변경: 회색 → 따뜻한 베이지 */
  border-bottom-left-radius: 4px;
}
```

---

## 개선 2: AI 프롬프트를 진짜 할아버지답게

> **문제**: 현재 프롬프트가 "할아버지인 척해"라고만 해서 AI가 상담원처럼 답변
> **목표**: 구체적인 성격, 입버릇, 답변 규칙을 주어 진짜 동네 할아버지처럼 말하게

### 수정 파일

| 파일 | 변경 |
|------|------|
| `ai/app/routers/chat.py` | system_instruction 전체 교체 |

### chat.py — system_instruction 교체 (55~61번 라인)

현재 코드:
```python
        system_instruction = (
            "당신은 '양평이 할아버지'입니다. 양평군에서 40년째 농사를 짓고 있는 베테랑 농부예요. "
            "친근하고 따뜻한 말투로 답변하세요. 존댓말을 기본으로 쓰되 가끔 '~해요', '~거든요' 같은 구어체를 섞어주세요. "
            "작물 재배, 농업 정책, 수급 현황에 대해 경험담을 곁들여 쉽고 정확하게 답변합니다. "
            "이모지를 적절히 사용하고, 고령 농업인도 이해하기 쉽게 작성하세요. "
            "예시 말투: '고추는 말이에요, 5월 초쯤 심으면 딱 좋거든요~ 🌶️ 저도 매년 그때쯤 정식한답니다!'"
        )
```

변경 코드:
```python
        system_instruction = (
            "## 캐릭터\n"
            "당신은 '양평이 할아버지'입니다.\n"
            "- 나이: 68세, 양평군 양서면에서 40년째 농사\n"
            "- 성격: 말이 많고, 옆길로 잘 새고, 자기 경험담을 꼭 끼워넣음\n"
            "- 좌우명: '농사는 하늘이 절반, 사람이 절반이여'\n\n"

            "## 말투 규칙\n"
            "- 반말과 존댓말을 자연스럽게 섞어 씁니다\n"
            "- 입버릇: '허허', '그거 말이야~', '우리 때는 말이지', '내 경험상은요'\n"
            "- 문장 끝에 '~요', '~거든요', '~한답니다', '~이여' 를 자연스럽게 씁니다\n"
            "- 이모지를 가끔 씁니다 (매 문장이 아니라 핵심 포인트에만)\n"
            "- 어려운 농업 용어를 쓰면 반드시 쉬운 설명을 괄호로 덧붙입니다\n\n"

            "## 답변 규칙\n"
            "- 답변은 3~5문장으로 짧게. 보고서가 아니라 대화입니다\n"
            "- 가능하면 자신의 경험담을 한 줄 넣으세요 (예: '나도 작년에 그래서 고생했어요~')\n"
            "- 모르는 건 솔직히 '허허, 그건 나도 잘 모르겠네요~ 농업기술센터에 한번 물어보시는 게...' 식으로\n"
            "- 절대 목록이나 번호 매기기를 하지 마세요. 자연스러운 대화체로만 답하세요\n"
            "- 상대를 '젊은이', '아이고' 같은 표현으로 친근하게 부르세요\n\n"

            "## 예시 대화\n"
            "질문: 고추 심기 좋은 시기가 언제야?\n"
            "답변: 아이고, 고추 심으려고요? 허허 반갑네~ 🌶️ "
            "고추는 말이야, 5월 초쯤이 딱이거든요. 너무 일찍 심으면 냉해 맞아서 고생해요. "
            "나도 한번은 4월에 욕심내다가 다 얼어버린 적이 있어요~ "
            "요즘 날씨가 좀 따뜻해졌다고는 하는데, 그래도 5월 첫째 주가 안전하답니다!"
        )
```

### 추가 변경: temperature와 max_tokens (63~68번 라인)

현재 코드:
```python
        reply = await llm.generate(
            prompt=request.message,
            system_instruction=system_instruction,
            temperature=0.7,
            max_tokens=1024,
        )
```

변경 코드:
```python
        reply = await llm.generate(
            prompt=request.message,
            system_instruction=system_instruction,
            temperature=0.85,   # 더 자연스럽고 다양한 표현을 위해 올림
            max_tokens=512,     # 짧은 대화체를 유도하기 위해 줄임
        )
```

---

## 개선 3: 빠른 질문 버튼 + 자연스러운 인사

> **문제**: 채팅 시작이 밋밋하고, 사용자가 뭘 물어볼지 몰라서 허탈함
> **목표**: 환영 메시지를 자연스럽게 바꾸고, 클릭만으로 대화를 시작할 수 있는 빠른 질문 버튼 제공

### 수정 파일

| 파일 | 변경 |
|------|------|
| `frontend/components/common/FarmBot/useFarmBot.ts` | 환영 메시지 변경 |
| `frontend/components/common/FarmBot/FarmBot.tsx` | 빠른 질문 버튼 UI 추가 |
| `frontend/components/common/FarmBot/FarmBot.module.css` | 빠른 질문 버튼 스타일 |

### useFarmBot.ts — 환영 메시지 변경

`startChat` 함수 내 환영 메시지를 찾아 교체합니다:

현재 코드:
```typescript
content: '어서 오세요! 🌱 양평 농사에 대해 궁금한 거 있으면 편하게 물어보세요~ 뭐든 알려드릴게요!',
```

변경 코드:
```typescript
content: '허허, 어서 와요~ 👋\n양평 농사에 대해 궁금한 게 있으면 편하게 물어봐요!\n아래 버튼을 눌러도 되고, 직접 입력해도 된답니다~ 🌱',
```

### FarmBot.tsx — 빠른 질문 버튼 추가

채팅 모드의 메시지 목록 내부(`<div className={styles.chatMessages}>`)에서,
`<div ref={chatEndRef} />` 바로 위에 다음 코드를 삽입합니다:

```tsx
              {/* 빠른 질문 버튼 — 대화 시작 전에만 표시 */}
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
```

### FarmBot.module.css — 빠른 질문 버튼 스타일 추가

파일 끝에 다음 CSS를 추가합니다:

```css
/* 빠른 질문 버튼 */
.quickQuestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.quickQuestionBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border: 1.5px solid #d4c9b8;
  border-radius: 12px;
  font-size: 13px;
  color: #5a4e3c;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.quickQuestionBtn:hover {
  background: #fff9f0;
  border-color: #2d7d46;
  color: #2d7d46;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 125, 70, 0.12);
}

.quickQuestionEmoji {
  font-size: 18px;
  flex-shrink: 0;
}
```

---

## 수정 파일 최종 요약

| # | 개선 | 파일 |
|:-:|:---:|------|
| 1-1 | 캐릭터 | `frontend/components/common/FarmBot/FarmBot.tsx` |
| 1-2 | 캐릭터 | `frontend/components/common/FarmBot/FarmBot.module.css` |
| 2-1 | 프롬프트 | `ai/app/routers/chat.py` |
| 3-1 | 빠른질문 | `frontend/components/common/FarmBot/useFarmBot.ts` |
| 3-2 | 빠른질문 | `frontend/components/common/FarmBot/FarmBot.tsx` |
| 3-3 | 빠른질문 | `frontend/components/common/FarmBot/FarmBot.module.css` |

---

## 적용 후 확인

```bash
docker compose up -d --build ai-server frontend
```

1. 할아버지 클릭 → "💬 질문하기" → 헤더에 Lottie 캐릭터가 움직이는지 확인
2. 채팅창 색감이 따뜻한 베이지 톤인지 확인
3. 환영 메시지 아래에 빠른 질문 3개 버튼이 보이는지 확인
4. 빠른 질문 클릭 → AI 응답이 할아버지 말투인지 확인 (짧고, 경험담 포함, 자연스러운 대화체)
5. 직접 입력 후 AI 응답이 목록/번호 없이 대화체로 오는지 확인
