/* ════════════════════════════════════════════════════════
   GuideBot — 메인 컴포넌트 (v7)
   - 유저 선택 후 가이드 시작
   - 축소 모드 캐릭터 왼쪽 바라봄
   - GuideBotContext Provider 내장 (showQuickMessage 외부 호출 지원)
   ════════════════════════════════════════════════════════ */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useGuideBot } from './useGuideBot';
import { GuideBotContext } from './GuideBotContext';
import styles from './GuideBot.module.css';

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

interface GuideBotProps {
  children?: ReactNode;
}

export default function GuideBot({ children }: GuideBotProps) {
  const lottieData = useLottieData();
  const duckData = useDuckLottieData();

  // 로그인 체크 (fb-user 쿠키 기반)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(document.cookie.includes('fb-user'));
  }, []);

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
  } = useGuideBot();

  // 미로그인 또는 시나리오 없으면 Provider만 제공
  if (!isLoggedIn) {
    return (
      <GuideBotContext.Provider value={{ showQuickMessage }}>
        {children}
      </GuideBotContext.Provider>
    );
  }
  if (!hasScenario && mode === 'minimized') {
    return (
      <GuideBotContext.Provider value={{ showQuickMessage }}>
        {children}
      </GuideBotContext.Provider>
    );
  }

  // ── 축소 모드: Footer에서 걸어다님 ──
  if (mode === 'minimized') {
    return (
      <GuideBotContext.Provider value={{ showQuickMessage }}>
        {children}
        <div className={`${styles.footerWalkWrap} ${prefersReducedMotion ? styles.reducedMotion : ''}`}>
          <button
            className={`${styles.footerWalkBtn} ${showBubble ? styles.footerWalkPaused : ''} ${!shouldAnimate ? styles.footerWalkFrozen : ''}`}
            onClick={restartGuide}
            title="가이드 시작"
            aria-label="가이드 도우미 열기"
          >
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
            {!showBubble && (
              <span className={styles.footerWalkTooltip}>클릭하면 가이드 시작! 👋</span>
            )}
          </button>
          {/* 퀵 메시지 말풍선 (외부 이벤트 트리거) */}
          {showBubble && (
            <div className={styles.quickBubble}>
              <p className={styles.bubbleText}>{bubbleMessage}</p>
            </div>
          )}
        </div>
      </GuideBotContext.Provider>
    );
  }

  // ── 질문 모드: "가이드 해드릴까요?" ──
  if (mode === 'asking') {
    return (
      <GuideBotContext.Provider value={{ showQuickMessage }}>
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
                  네, 안내해주세요! 🌱
                </button>
                <button className={styles.askBtnNo} onClick={declineGuide}>
                  괜찮아요
                </button>
              </div>
              <button className={styles.bubbleClose} onClick={declineGuide} aria-label="닫기">✕</button>
            </div>
          )}
        </div>
      </GuideBotContext.Provider>
    );
  }

  // ── 가이드 모드 ──
  const bubbleClass = bubbleAbove ? styles.bubbleAbove : styles.bubbleBelow;

  return (
    <GuideBotContext.Provider value={{ showQuickMessage }}>
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
                <span className={styles.stepCounter}>{currentStep + 1} / {totalSteps}</span>
                <div className={styles.bubbleBtns}>
                  {currentStep > 0 && (
                    <button className={styles.bubbleBtnPrev} onClick={prevStep}>← 이전</button>
                  )}
                  {currentStep < totalSteps - 1 ? (
                    <button className={styles.bubbleBtnNext} onClick={nextStep}>다음 →</button>
                  ) : (
                    <button className={styles.bubbleBtnNext} onClick={stopGuide}>완료 ✓</button>
                  )}
                </div>
              </div>
            )}
            <button className={styles.bubbleClose} onClick={stopGuide} aria-label="가이드 닫기">✕</button>
          </div>
        )}
      </div>
    </GuideBotContext.Provider>
  );
}
