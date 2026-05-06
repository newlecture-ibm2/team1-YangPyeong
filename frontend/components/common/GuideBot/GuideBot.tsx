/* ════════════════════════════════════════════════════════
   GuideBot — 메인 컴포넌트 (v6)
   - 유저 선택 후 가이드 시작
   - 축소 모드 캐릭터 왼쪽 바라봄
   ════════════════════════════════════════════════════════ */

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useGuideBot } from './useGuideBot';
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

export default function GuideBot() {
  const lottieData = useLottieData();
  const duckData = useDuckLottieData();

  // 로그인 체크 (fb-user 쿠키 기반)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(document.cookie.includes('fb-user'));
  }, []);

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
  } = useGuideBot();

  // 미로그인 또는 시나리오 없으면 숨김
  if (!isLoggedIn) return null;
  if (!hasScenario && mode === 'minimized') return null;

  // ── 축소 모드: Footer에서 걸어다님 ──
  if (mode === 'minimized') {
    return (
      <div className={styles.footerWalkWrap}>
        <button
          className={styles.footerWalkBtn}
          onClick={restartGuide}
          title="가이드 시작"
          aria-label="가이드 도우미 열기"
        >
          {lottieData && (
            <Lottie
              animationData={lottieData}
              loop
              autoplay
              className={styles.footerWalkLottie}
            />
          )}
          {duckData && (
            <div className={styles.footerWalkDuckWrap}>
              <Lottie
                animationData={duckData}
                loop
                autoplay
                className={styles.footerWalkDuckLottie}
              />
            </div>
          )}
          <span className={styles.footerWalkTooltip}>클릭하면 가이드 시작! 👋</span>
        </button>
      </div>
    );
  }

  // ── 질문 모드: "가이드 해드릴까요?" ──
  if (mode === 'asking') {
    return (
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
    );
  }

  // ── 가이드 모드 ──
  const bubbleClass = bubbleAbove ? styles.bubbleAbove : styles.bubbleBelow;

  return (
    <>
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
    </>
  );
}
