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
import { FARM_BOT_CONSTANTS } from './farmBotConstants';
import { useChatActions } from './useChatActions';
import type { ChatAction } from '@/lib/chat-types';

export type BotState = 'idle' | 'walking' | 'pointing' | 'waving';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  /** AI 응답에 포함된 액션 목록 (bot 메시지에만 존재) */
  actions?: ChatAction[];
}

/** 가이드 진행 모드 */
export type GuideMode = 'minimized' | 'asking' | 'guiding' | 'hidden' | 'chatting';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'farmbot-seen';
const HIDDEN_KEY = 'farmbot-hidden';
const CHARACTER_SIZE = 120;

export function useFarmBot() {
  const pathname = usePathname();
  const dispatchChatActions = useChatActions();

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

  // ── 채팅 상태 ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickMsgRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAsked = useRef(false);

  // 페이지 변경 시 시나리오 갱신
  useEffect(() => {
    const scenario = getScenarioForPath(pathname || '/');

    // 채팅 중이면 모드를 유지 — 페이지 이동해도 챗봇 창 닫지 않음
    setMode(prev => prev === 'chatting' ? 'chatting' : 'minimized');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    setCurrentStep(-1);
    hasAsked.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (scenario) {
      setSteps(scenario.steps);
    } else {
      setSteps([]);
    }
  }, [pathname]);

  /** 타겟 요소로 캐릭터를 이동시킵니다 */
  const moveToElement = useCallback((step: FarmBotStep, onArrive: () => void) => {
    const el = document.querySelector(step.target);
    // 타겟 못 찾거나, 화면에 보이지 않으면 스킵 (모바일에서 숨겨진 요소 등)
    if (!el || (el as HTMLElement).offsetParent === null) {
      onArrive();
      return;
    }

    // 먼저 요소가 화면 중앙에 오도록 부드럽게 스크롤합니다
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 이동 시작 즉시 말풍선 숨김 (캐릭터 이동 전에 말풍선이 잔류하지 않도록)
    setShowBubble(false);

    // 스크롤이 어느 정도 완료된 후 위치를 계산합니다
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        onArrive();
        return;
      }

      setHighlightRect(rect);

      // 모바일에서는 실제 렌더 크기(70px)로 중앙 계산
      const isMobile = window.innerWidth <= 768;
      const charSize = isMobile ? 70 : CHARACTER_SIZE;

      const targetX = rect.left + rect.width / 2 - charSize / 2;
      const targetY = rect.bottom + 12;

      // 방향 결정
      setFacingRight(targetX > position.x);

      setBotState('walking');
      const finalY = Math.min(targetY, window.innerHeight - charSize - 20);
      setPosition({ x: targetX, y: finalY });
      setBubbleAbove(finalY > window.innerHeight / 2);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setBotState('idle');
        // 캐릭터 도착 시점에 rect 재측정 (스크롤 완료 후 정확한 위치)
        const finalRect = el.getBoundingClientRect();
        if (finalRect.width > 0 || finalRect.height > 0) {
          setHighlightRect(finalRect);
        }
        onArrive();
      }, 1350); // 총 1850ms 중 스크롤 대기 시간 500ms를 뺀 나머지 시간
    }, 500);
  }, [position.x]);

  /** 특정 스텝으로 이동 — 타겟이 DOM에 없으면 자동으로 다음 스텝으로 건너뜀 */
  const goToStep = useCallback((stepIdx: number, _visited?: Set<number>) => {
    if (stepIdx < 0 || stepIdx >= steps.length) return;

    const visited = _visited || new Set<number>();
    if (visited.has(stepIdx)) return; // 무한루프 방지
    visited.add(stepIdx);

    const step = steps[stepIdx];
    const el = document.querySelector(step.target);

    // 타겟이 DOM에 존재하지 않으면 다음 스텝으로 건너뛰기
    if (!el) {
      if (stepIdx + 1 < steps.length) {
        goToStep(stepIdx + 1, visited);
      }
      return;
    }

    setCurrentStep(stepIdx);
    moveToElement(step, () => {
      setBubbleMessage(step.message);
      setShowBubble(true);
    });
  }, [steps, moveToElement]);

  /** 페이지 진입 시 — 캐릭터가 등장하여 "가이드 해드릴까요?" 질문 */
  const askUser = useCallback(() => {
    if (steps.length === 0) return;
    // 채팅 중이면 가이드 시작 팝업 무시 — 모드/말풍선 변경 없이 바로 리턴
    setMode(prev => {
      if (prev === 'chatting') return 'chatting';

      // 채팅 중이 아닐 때만 나머지 상태 업데이트
      setBotState('idle');
      setFacingRight(true);
      setShowBubble(true);
      setBubbleMessage('안녕하세요! 👋\n이 페이지를 안내해드릴까요?');
      setBubbleAbove(true);
      setPosition({
        x: window.innerWidth / 2 - 60,
        y: window.innerHeight - 180,
      });
      return 'asking';
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

  /** 이전 스텝 (타겟 없는 스텝은 건너뜀) */
  const prevStep = useCallback(() => {
    for (let i = currentStep - 1; i >= 0; i--) {
      const el = document.querySelector(steps[i].target);
      if (el) {
        goToStep(i);
        return;
      }
    }
  }, [currentStep, steps, goToStep]);

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
  // ⚠️ 채팅 중(chatting)이면 가이드 자동 시작/모드 변경을 하지 않음
  useEffect(() => {
    if (hasAsked.current) return;
    if (steps.length === 0) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      hasAsked.current = true;
      // 채팅 중이면 가이드 질문 팝업 건너뜀 (800ms 뒤 현재 mode 재확인)
      const timer = setTimeout(() => {
        askUser(); // askUser 내부에서 setMode('asking') — 채팅 중이면 무시되도록 아래 askUser에서 처리
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // 채팅 중이면 minimized로 내리지 않음
      setMode(prev => prev === 'chatting' ? 'chatting' : 'minimized');
    }
  }, [steps, askUser]);

  /** 채팅 모드 시작 */
  const startChat = useCallback(() => {
    setMode('chatting');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'bot',
        content: FARM_BOT_CONSTANTS.WELCOME_MESSAGE,
      }]);
    }
  }, [chatMessages.length]);

  /** 메시지 전송 (대화 히스토리 포함)
   *
   * @param message      채팅창에 표시될 사용자 메시지
   * @param sendAs       (선택) 실제 AI에게 전송할 메시지. 생략 시 message 사용.
   *                     상품 카드 클릭 등 내부 식별자(id)는 노출하지 않고 AI에만 전달할 때 사용.
   */
  const sendChatMessage = useCallback(async (message: string, sendAs?: string) => {
    if (!message.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: message.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    // 히스토리: 현재 메시지 추가 전(chatMessages)을 기준으로 생성
    // updatedMessages를 쓰면 현재 user 메시지가 중복 전송됨
    const history = chatMessages.slice(-FARM_BOT_CONSTANTS.HISTORY_LIMIT).map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.content,
    }));

    const payloadMessage = (sendAs ?? message).trim();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payloadMessage,
          history,
          currentPath: pathname,
        }),
      });
      const data = await res.json();

      const reply: string = data?.success
        ? (data.data?.reply ?? FARM_BOT_CONSTANTS.ERROR_MESSAGE)
        : FARM_BOT_CONSTANTS.ERROR_MESSAGE;
      const actions: ChatAction[] = data?.success
        ? (data.data?.actions ?? [])
        : [];

      const botReply: ChatMessage = {
        role: 'bot',
        content: reply,
        actions,
      };
      setChatMessages(prev => [...prev, botReply]);

      // 즉시 실행형 액션은 디스패처에 위임 (CLARIFY/CONFIRM은 UI에서 렌더)
      dispatchChatActions(
        actions.filter(a =>
          a.type === 'NAVIGATE' ||
          a.type === 'FILL_FORM' ||
          a.type === 'TOAST' ||
          a.type === 'REFRESH' ||
          a.type === 'OPEN_MODAL',
        ),
      );
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: FARM_BOT_CONSTANTS.NETWORK_ERROR,
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, chatMessages, pathname, dispatchChatActions]);

  /** 채팅 종료 */
  const closeChat = useCallback(() => {
    setMode('minimized');
  }, []);

  /** 채팅 초기화 */
  const resetChat = useCallback(() => {
    setChatMessages([{
      role: 'bot',
      content: FARM_BOT_CONSTANTS.RESET_MESSAGE,
    }]);
    setChatInput('');
  }, []);

  // 가이드 중 스크롤 잠금
  useEffect(() => {
    if (mode === 'guiding' || mode === 'chatting') {
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

  // DOM에 존재하는 유효 스텝 인덱스 목록 (카운터 표시용)
  const getVisibleStepInfo = useCallback(() => {
    const validIndices = steps
      .map((s, i) => ({ idx: i, exists: !!document.querySelector(s.target) }))
      .filter((v) => v.exists)
      .map((v) => v.idx);
    const visiblePos = validIndices.indexOf(currentStep);
    return {
      visibleIndex: visiblePos >= 0 ? visiblePos : 0,
      visibleTotal: validIndices.length || steps.length,
    };
  }, [steps, currentStep]);

  return {
    isMounted,
    mode,
    currentStep,
    totalSteps: steps.length,
    getVisibleStepInfo,
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
