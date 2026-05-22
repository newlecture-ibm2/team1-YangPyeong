/* ════════════════════════════════════════════════════════
   FarmBot — 메인 컴포넌트 (v7)
   - 유저 선택 후 가이드 시작
   - 축소 모드 캐릭터 왼쪽 바라봄
   - FarmBotContext Provider 내장 (showQuickMessage 외부 호출 지원)
   ════════════════════════════════════════════════════════ */

'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useFarmBot, ChatMessage, NodeStatus } from './useFarmBot';
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
    chatPosition,
    chatSize,
    onChatDragStart,
    onChatResizeStart,
    activeNodes,
  } = useFarmBot();

  const chatEndRef = useRef<HTMLDivElement>(null);

  /** 봇 응답에서 내부 식별자(id=123 / productId=123) 패턴 제거 — 화면 표시용 */
  const stripInternalIds = (text: string): string =>
    text
      .replace(/\s*[\(\[]?\s*(?:product)?[Ii][Dd]\s*[:=]\s*\d+\s*[\)\]]?/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

  useEffect(() => {
    if (mode === 'chatting') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mode]);

  // 말풍선이 뷰포트 밖으로 나가지 않도록 transform offset 계산 (고정 너비 290px 기반)
  const computeBubbleShift = (): number => {
    if (typeof window === 'undefined') return 0;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return 0;
    const charW = 70;
    const margin = 16;
    const bubbleW = Math.min(290, window.innerWidth - margin * 2);
    const charCenterX = position.x + charW / 2;
    const idealLeft = charCenterX - bubbleW / 2;
    const maxLeft = window.innerWidth - bubbleW - margin;
    const safeLeft = Math.max(margin, Math.min(idealLeft, maxLeft));
    return safeLeft - idealLeft;
  };

  // 클라이언트 마운트 전에는 자식 요소만 렌더링 (Hydration 에러 방지)
  if (!isMounted) {
    return (
      <FarmBotContext.Provider value={{ showQuickMessage, startChat }}>
        {children}
      </FarmBotContext.Provider>
    );
  }

  // 시나리오 없어도 챗봇 버튼은 항상 표시 (가이드 없는 페이지에서도 질문 가능)

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
            onClick={(e) => restartGuide(e)}
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
                <span className={styles.tooltipIntro}>저는 팜가이드, 양평이 할아버지예요! 👨‍🌾</span>
                <span className={styles.tooltipAction}>양평 농사에 대해 무엇이든 물어보세요~ 👆</span>
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
        <div
          className={styles.chatContainer}
          style={{
            position: 'fixed',
            left: chatPosition.x,
            top: chatPosition.y,
            width: chatSize.width,
            height: chatSize.height,
            zIndex: 10001,
          }}
        >
          {/* 헤더 — 드래그 핸들 */}
          <div className={styles.chatHeader} onMouseDown={onChatDragStart}>
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
            {chatMessages.map((msg: ChatMessage, idx: number) => (
              <div
                key={idx}
                className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgBot}`}
              >
                {msg.role === 'bot' && (
                  <Image src="/icon.png" alt="" width={28} height={28} className={styles.chatMsgAvatar} />
                )}
                <div className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot}`}>
                  <span className={styles.chatMsgContent} style={{ whiteSpace: 'pre-wrap' }}>{stripInternalIds(msg.content)}</span>

                  {/* CLARIFY 선택지 버튼 */}
                  {msg.role === 'bot' && msg.actions?.filter(a => a.type === 'CLARIFY').map((action, actionIdx) => (
                    <div key={`clarify-${actionIdx}`} className={styles.clarifyOptions}>
                      {action.options?.map((opt, optIdx) => (
                        <button
                          key={`opt-${optIdx}`}
                          className={styles.clarifyOptionBtn}
                          onClick={() => sendChatMessage(
                            opt.label,
                            action.intent === 'CANCEL_ORDER'
                              ? `주문번호 ${opt.id} 취소해줘`
                              : `${opt.id} 선택할게`
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ))}

                  {/* PRODUCT_LIST 상품 카드 */}
                  {msg.role === 'bot' && msg.actions?.filter(a => a.type === 'PRODUCT_LIST' && a.products && a.products.length > 0).map((action, actionIdx) => (
                    <div key={`product-list-${actionIdx}`} className={styles.productList}>
                      {action.products!.map((product) => (
                        <a
                          key={product.id}
                          href={`/shop/${product.id}`}
                          className={styles.productCard}
                        >
                          <div className={styles.productCardImgWrap}>
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.imageUrl} alt={product.name} className={styles.productCardImg} />
                            ) : (
                              <div className={styles.productCardImgPlaceholder}>🌿</div>
                            )}
                          </div>
                          <div className={styles.productCardBody}>
                            <span className={styles.productCardName}>{product.name}</span>
                            <span className={styles.productCardPrice}>₩{product.price.toLocaleString()}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className={`${styles.chatMsg} ${styles.chatMsgBot}`}>
                <Image src="/icon.png" alt="" width={28} height={28} className={styles.chatMsgAvatar} />
                <div className={`${styles.chatBubble} ${styles.chatBubbleBot}`}>
                  {activeNodes.length > 0 ? (
                    <div key="tracker" className={styles.nodeTracker}>
                      <span className={styles.nodeTrackerTitle}>👨‍🌾 양평이 할아버지가 꼼꼼히 고민 중이에요...</span>
                      <div className={styles.nodeTrackerList}>
                        {activeNodes.map((node: NodeStatus) => (
                          <div key={node.node} className={styles.nodeTrackerItem}>
                            <span className={styles.nodeTrackerIcon}>
                              {node.status === 'completed' ? '🟢' : '🔄'}
                            </span>
                            <span className={styles.nodeTrackerLabel}>
                              {node.label}
                            </span>
                            <span className={styles.nodeTrackerStatus}>
                              {node.status === 'completed' ? '완료' : '확인 중...'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span key="typing" className={styles.chatTyping}>할아버지가 답변을 적고 있어요... ⏳</span>
                  )}
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

          {/* 리사이즈 핸들 */}
          <div className={styles.resizeHandle} onMouseDown={onChatResizeStart} />
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
                {hasScenario && (
                  <button className={styles.askBtnYes} onClick={acceptGuide}>
                    🌱 가이드 시작
                  </button>
                )}
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


  const shift = computeBubbleShift();
  const bubbleStyle = shift !== 0
    ? { transform: `translateX(calc(-50% + ${shift}px))` }
    : undefined;

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
        className={`${styles.botContainer} ${botState === 'walking' ? styles.botContainerWalking : ''}`}
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
          <div className={`${styles.bubble} ${bubbleClass}`} style={bubbleStyle}>
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