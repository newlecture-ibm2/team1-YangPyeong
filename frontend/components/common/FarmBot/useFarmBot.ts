/* ════════════════════════════════════════════════════════
   FarmBot Hook — 가이드 상태 관리 (v3)
   - 자동 시작 X → 유저 선택 후 시작
   - 축소 모드 캐릭터 왼쪽 바라봄
   - 페이지별 가이드 재시작 가능
   ════════════════════════════════════════════════════════ */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getScenarioForPath } from './farmBotScenarios';
import type { FarmBotStep } from './farmBotScenarios';

export type BotState = 'idle' | 'walking' | 'pointing' | 'waving';

/** 가이드 진행 모드 (향후 'chat' 추가 예정) */
export type GuideMode = 'minimized' | 'asking' | 'guiding' | 'hidden';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'farmbot-seen';
const HIDDEN_KEY = 'farmbot-hidden';
const CHARACTER_SIZE = 120;

export function useFarmBot() {
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<GuideMode>('minimized');
  const [currentStep, setCurrentStep] = useState(-1);
  const [botState, setBotState] = useState<BotState>('idle');
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return { x: window.innerWidth / 2 - 60, y: window.innerHeight - 180 };
  });
  const [facingRight, setFacingRight] = useState(false); // 기본 왼쪽 바라봄
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [steps, setSteps] = useState<FarmBotStep[]>([]);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [bubbleAbove, setBubbleAbove] = useState(true);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickMsgRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAsked = useRef(false);

  // 페이지 변경 시 시나리오 갱신
  useEffect(() => {
    const scenario = getScenarioForPath(pathname || '/');
    if (scenario) {
      setSteps(scenario.steps);
    } else {
      setSteps([]);
    }
    // 페이지 변경 시 진행 중인 가이드 중지 + 리셋
    setMode('minimized');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    setCurrentStep(-1);
    hasAsked.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [pathname]);

  /** 타겟 요소로 캐릭터를 이동시킵니다 */
  const moveToElement = useCallback((step: FarmBotStep, onArrive: () => void) => {
    const el = document.querySelector(step.target);
    // 타겟 못 찾거나, 화면에 보이지 않으면 스킵 (모바일에서 숨겨진 요소 등)
    if (!el || (el as HTMLElement).offsetParent === null) {
      onArrive();
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      onArrive();
      return;
    }

    setHighlightRect(rect);

    const targetX = rect.left + rect.width / 2 - CHARACTER_SIZE / 2;
    const targetY = rect.bottom + 12;

    // 방향 결정
    setFacingRight(targetX > position.x);

    setBotState('walking');
    setShowBubble(false);
    const finalY = Math.min(targetY, window.innerHeight - CHARACTER_SIZE - 20);
    setPosition({ x: targetX, y: finalY });
    setBubbleAbove(finalY > window.innerHeight / 2);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setBotState('idle');
      onArrive();
    }, 1850);
  }, [position.x]);

  /** 특정 스텝으로 이동 */
  const goToStep = useCallback((stepIdx: number) => {
    if (stepIdx < 0 || stepIdx >= steps.length) return;

    setCurrentStep(stepIdx);
    const step = steps[stepIdx];

    moveToElement(step, () => {
      setBubbleMessage(step.message);
      setShowBubble(true);
    });
  }, [steps, moveToElement]);

  /** 페이지 진입 시 — 캐릭터가 등장하여 "가이드 해드릴까요?" 질문 */
  const askUser = useCallback(() => {
    if (steps.length === 0) return;
    setMode('asking');
    setBotState('idle');
    setFacingRight(true);
    setShowBubble(true);
    setBubbleMessage('안녕하세요! 👋\n이 페이지를 안내해드릴까요?');
    setBubbleAbove(true);
    // 화면 하단 중앙에 위치
    setPosition({
      x: window.innerWidth / 2 - 60,
      y: window.innerHeight - 180,
    });
  }, [steps]);

  /** 유저가 "네" 선택 → 최상단 이동 후 가이드 시작 */
  const acceptGuide = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMode('guiding');
    setShowBubble(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    if (steps.length > 0) {
      // 스크롤 완료 후 가이드 시작
      setTimeout(() => goToStep(0), 500);
    }
  }, [steps, goToStep]);

  /** 유저가 "아니요" 선택 → 축소 모드 */
  const declineGuide = useCallback(() => {
    setMode('minimized');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  /** 다음 스텝 */
  const nextStep = useCallback(() => {
    const next = currentStep + 1;
    if (next < steps.length) {
      goToStep(next);
    } else {
      setBotState('idle');
      setShowBubble(true);
      setBubbleMessage('가이드가 끝났어요! 궁금한 게 있으면 저를 클릭해주세요 😊');
      setHighlightRect(null);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setMode('minimized');
        setShowBubble(false);
        setBotState('idle');
      }, 2500);
    }
  }, [currentStep, steps, goToStep]);

  /** 이전 스텝 */
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  /** 가이드 중지 */
  const stopGuide = useCallback(() => {
    setMode('minimized');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  /** 가이드봇 숨기기 (localStorage 영구 저장) */
  const hideBot = useCallback(() => {
    setMode('hidden');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    localStorage.setItem(HIDDEN_KEY, 'true');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  /** 가이드봇 다시 보기 */
  const showBot = useCallback(() => {
    setMode('minimized');
    localStorage.removeItem(HIDDEN_KEY);
  }, []);

  /** 외부 이벤트에서 가이드봇이 잠시 말풍선을 보여줍니다 (예: AI 자동 채우기 완료) */
  const showQuickMessage = useCallback((message: string, durationMs: number = 4000) => {
    // 가이드 진행 중이면 무시
    if (mode === 'guiding' || mode === 'asking') return;

    // 기존 퀵 메시지 타이머 정리
    if (quickMsgRef.current) clearTimeout(quickMsgRef.current);

    setMode('minimized');
    setBotState('idle');
    setFacingRight(true);
    setShowBubble(true);
    setBubbleMessage(message);
    setBubbleAbove(true);
    setHighlightRect(null);
    setCurrentStep(-1);

    // 하단 중앙 위치
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth / 2 - 60,
        y: window.innerHeight - 180,
      });
    }

    quickMsgRef.current = setTimeout(() => {
      setShowBubble(false);
      setMode('minimized');
    }, durationMs);
  }, [mode]);

  /** 축소 모드에서 재시작 */
  const restartGuide = useCallback(() => {
    askUser();
  }, [askUser]);

  // 페이지 로드 시 자동 질문 (첫 방문만)
  useEffect(() => {
    if (hasAsked.current) return;
    if (steps.length === 0) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      hasAsked.current = true;
      const timer = setTimeout(() => askUser(), 800);
      return () => clearTimeout(timer);
    } else {
      setMode('minimized');
    }
  }, [steps, askUser]);

  // 가이드 중 스크롤 잠금
  useEffect(() => {
    if (mode === 'guiding' || mode === 'asking') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mode]);

  // 클린업 및 초기 마운트 설정
  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem(HIDDEN_KEY) === 'true') {
      setMode('hidden');
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
  };
}
