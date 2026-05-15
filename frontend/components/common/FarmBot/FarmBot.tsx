/* ════════════════════════════════════════════════════════
   FarmBot — 메인 컴포넌트 (v7)
   - 유저 선택 후 가이드 시작
   - 축소 모드 캐릭터 왼쪽 바라봄
   - FarmBotContext Provider 내장 (showQuickMessage 외부 호출 지원)
   ════════════════════════════════════════════════════════ */

'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useFarmBot } from './useFarmBot';
import { FarmBotContext } from './FarmBotContext';
import Image from 'next/image';
import styles from './FarmBot.module.css';
import { FARM_BOT_CONSTANTS } from './farmBotConstants';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

function useLottieData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/guide/walking.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, []);
  return data;
}

function useDuckLottieData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/guide/duck.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, []);
  return data;
}

interface FarmBotProps {
  children?: ReactNode;
}

export default function FarmBot({ children }: FarmBotProps) {
  const lottieData = useLottieData();
  const duckData = useDuckLottieData();


  // ── 최적화 1: 화면을 안 보고 있으면 Lottie 일시정지 ──
  // - visibilitychange: 같은 브라우저 내 탭 전환/최소화 감지
  // - blur/focus: 다른 앱(듀얼모니터 등)으로 전환 시 감지
  const [isPageVisible, setIsPageVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    const handleFocus = () => setIsPageVisible(true);
    const handleBlur = () => setIsPageVisible(false);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // ── 최적화 3: prefers-reduced-motion 감지 ──
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Lottie 재생 여부: 페이지 보이고 + reduced-motion 아닐 때만
  const shouldAnimate = isPageVisible && !prefersReducedMotion;

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
    startChat,
    closeChat,
    sendChatMessage,
    resetChat,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    getVisibleStepInfo,
  } = useFarmBot();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'chatting') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mode]);

  // 클라이언트 마운트 전에는 자식 요소만 렌더링 (Hydration 에러 방지)
  if (!isMounted) {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
      </FarmBotContext.Provider>
    );
  }

  // 시나리오 없으면 Provider만 제공
  if (!hasScenario && mode === 'minimized') {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
      </FarmBotContext.Provider>
    );
  }

  // ── 숨김 모드: 하단 구석에 복원 아이콘 ──
  if (mode === 'hidden') {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
        <button
          className={styles.restoreBtn}
          onClick={showBot}
          title="가이드봇 다시 보기"
          aria-label="가이드봇 다시 보기"
        >
          <Image src="/icon.png" alt="가이드봇" width={48} height={48} className={styles.restoreIcon} />
        </button>
      </FarmBotContext.Provider>
    );
  }

  // ── 축소 모드: Footer에서 걸어다님 ──
  if (mode === 'minimized') {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
        <div className={`${styles.footerWalkWrap} ${prefersReducedMotion ? styles.reducedMotion : ''}`}>
          <button
            className={`${styles.footerWalkBtn} ${showBubble ? styles.footerWalkPaused : ''} ${!shouldAnimate ? styles.footerWalkFrozen : ''}`}
            onClick={restartGuide}
            title="가이드 시작"
            aria-label="가이드 도우미 열기"
          >
            <div className={styles.footerWalkCharacterWrap}>
              <div className={styles.footerWalkCharacterScale}>
                {lottieData && (
                  <Lottie
                    animationData={lottieData}
                    loop={shouldAnimate}
                    autoplay={shouldAnimate}
                    className={styles.footerWalkLottie}
                  />
                )}
                {duckData && (
                  <div className={styles.footerWalkDuckWrap}>
                    <Lottie
                      animationData={duckData}
                      loop={shouldAnimate}
                      autoplay={shouldAnimate}
                      className={styles.footerWalkDuckLottie}
                    />
                  </div>
                )}
              </div>
            </div>
            {!showBubble && (
              <span className={styles.footerWalkTooltip}>
                <span className={styles.tooltipTitle}>저 눌러주세요~ 👆</span>
              </span>
            )}
          </button>
          {/* 퀘 메시지 말풍선 (외부 이벤트 트리거) */}
          {showBubble && (
            <div className={styles.quickBubble}>
              <p className={styles.bubbleText}>{bubbleMessage}</p>
            </div>
          )}
        </div>
      </FarmBotContext.Provider>
    );
  }

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
                  <span className={styles.chatTitle}>{FARM_BOT_CONSTANTS.BOT_NAME}</span>
                  <span className={styles.chatSubtitle}>{FARM_BOT_CONSTANTS.BOT_SUBTITLE}</span>
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
                  {FARM_BOT_CONSTANTS.QUICK_QUESTIONS.map((q, idx) => (
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

  // ── 질문 모드: "가이드 해드릴까요?" ──
  if (mode === 'asking') {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
        <div
          className={styles.botContainer}
          style={{ left: position.x, top: position.y }}
        >
          <div
            className={styles.lottieWrap}
            style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
          >
            {duckData && (
              <div className={styles.duckWrap}>
                <Lottie animationData={duckData} loop autoplay className={styles.duckLottie} />
              </div>
            )}
            {lottieData && (
              <Lottie animationData={lottieData} loop autoplay className={styles.lottieCharacter} />
            )}
          </div>

          {showBubble && (
            <div className={`${styles.bubble} ${styles.bubbleAbove}`}>
              <p className={styles.bubbleText}>{bubbleMessage}</p>
              <div className={styles.askBtns}>
                <button className={styles.askBtnYes} onClick={acceptGuide}>
                  🌱 가이드 시작
                </button>
                <button
                  className={styles.askBtnChat}
                  onClick={(e) => { e.stopPropagation(); startChat(); }}
                >
                  💬 질문하기
                </button>
                <button className={styles.askBtnNo} onClick={hideBot}>
                  숨기기
                </button>
              </div>
              <button className={styles.bubbleClose} onClick={declineGuide} aria-label="닫기">✕</button>
            </div>
          )}
        </div>
      </FarmBotContext.Provider>
    );
  }

  // ── 가이드 모드 ──
  const bubbleClass = bubbleAbove ? styles.bubbleAbove : styles.bubbleBelow;

  const { visibleIndex, visibleTotal } = getVisibleStepInfo();

  return (
    <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
      {children}
      {highlightRect && (
        <div className={styles.overlay}>
          <div
            className={styles.highlightHole}
            style={{
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12,
            }}
          />
        </div>
      )}

      <div
        className={styles.botContainer}
        style={{ left: position.x, top: position.y }}
      >
        <div
          className={styles.lottieWrap}
          style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
        >
          {duckData && (
            <div className={styles.duckWrap}>
              <Lottie animationData={duckData} loop autoplay className={styles.duckLottie} />
            </div>
          )}
          {lottieData && (
            <Lottie animationData={lottieData} loop autoplay className={styles.lottieCharacter} />
          )}
        </div>

        {showBubble && (
          <div className={`${styles.bubble} ${bubbleClass}`}>
            <p className={styles.bubbleText}>{bubbleMessage}</p>
            {currentStep >= 0 && (
              <div className={styles.bubbleActions}>
                <span className={styles.stepCounter}>{visibleIndex + 1} / {visibleTotal}</span>
                <div className={styles.bubbleBtns}>
                  {visibleIndex > 0 && (
                    <button className={styles.bubbleBtnPrev} onClick={prevStep}>← 이전</button>
                  )}
                  {visibleIndex < visibleTotal - 1 ? (
                    <button className={styles.bubbleBtnNext} onClick={nextStep}>다음 →</button>
                  ) : (
                    <>
                      <span
                        role="button"
                        tabIndex={0}
                        className={styles.tooltipChatBtn}
                        onClick={(e) => { e.stopPropagation(); startChat(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); startChat(); } }}
                      >
                        💬 질문하기
                      </span>
                      <button className={styles.tooltipGuideBtn} onClick={stopGuide}>
                        완료 ✓
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            <button className={styles.bubbleClose} onClick={stopGuide} aria-label="가이드 닫기">✕</button>
          </div>
        )}
      </div>
    </FarmBotContext.Provider>
  );
}
