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

  // ── 채팅창 위치/크기 상태 ──
  const [chatPosition, setChatPosition] = useState({ x: -1, y: -1 }); // -1이면 초기화 필요
  const [chatSize, setChatSize] = useState({ width: 380, height: 520 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickMsgRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAsked = useRef(false);

  // ── 최신 상태를 안전하게 조회하기 위한 Ref 바인딩 ──
  const modeRef = useRef<GuideMode>(mode);
  const positionRef = useRef<Position>(position);
  const stepsRef = useRef<FarmBotStep[]>(steps);
  const currentStepRef = useRef<number>(currentStep);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  // 페이지 변경 시 시나리오 갱신
  useEffect(() => {
    const scenario = getScenarioForPath(pathname || '/');
    const isHidden = localStorage.getItem(HIDDEN_KEY) === 'true';

    // 페이지 변경 시 진행 중인 가이드 중지 + 리셋
    // - 숨김 상태이면 hidden 유지
    // - 채팅 중이면 chatting 유지하여 페이지 이동 시에도 대화창 닫히지 않게 조절
    setMode(prev => {
      if (isHidden) return 'hidden';
      return prev === 'chatting' ? 'chatting' : 'minimized';
    });
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

      // positionRef.current를 사용해 의존성 최소화
      setFacingRight(targetX > positionRef.current.x);

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
  }, []); // 의존성 제거로 불필요한 재생성 방지

  /** 특정 스텝으로 이동 — 타겟이 DOM에 없으면 자동으로 다음 스텝으로 건너뜀 */
  const goToStep = useCallback((stepIdx: number, _visited?: Set<number>) => {
    const currentSteps = stepsRef.current;
    if (stepIdx < 0 || stepIdx >= currentSteps.length) return;

    const visited = _visited || new Set<number>();
    if (visited.has(stepIdx)) return; // 무한루프 방지
    visited.add(stepIdx);

    const step = currentSteps[stepIdx];
    const el = document.querySelector(step.target);

    // 타겟이 DOM에 존재하지 않으면 다음 스텝으로 건너뛰기
    if (!el) {
      if (stepIdx + 1 < currentSteps.length) {
        goToStep(stepIdx + 1, visited);
      }
      return;
    }

    setCurrentStep(stepIdx);
    moveToElement(step, () => {
      setBubbleMessage(step.message);
      setShowBubble(true);
    });
  }, [moveToElement]);

  /** 페이지 진입 시 — 캐릭터가 등장하여 "가이드 해드릴까요?" 질문 */
  const askUser = useCallback((customPosition?: Position) => {
    if (stepsRef.current.length === 0) return;

    // 채팅 중이면 가이드 시작 팝업 무시 — 모드/말풍선 변경 없이 바로 리턴
    if (modeRef.current === 'chatting') return;

    setMode('asking');
    setBotState('idle');
    setShowBubble(true);
    setBubbleMessage('안녕하세요! 👋\n이 페이지를 안내해드릴까요?');
    setBubbleAbove(true);

    if (customPosition) {
      setPosition(customPosition);
      // 화면 중앙을 기준으로 왼쪽 절반에 있으면 오른쪽을 바라보고, 오른쪽 절반에 있으면 왼쪽을 바라봄
      const lookRight = customPosition.x < window.innerWidth / 2;
      setFacingRight(lookRight);
    } else {
      setFacingRight(true);
      // 화면 하단 중앙에 위치
      setPosition({
        x: window.innerWidth / 2 - 60,
        y: window.innerHeight - 180,
      });
    }
  }, []);

  /** 유저가 "네" 선택 → 최상단 이동 후 가이드 시작 */
  const acceptGuide = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' }); // 스크롤 충돌 방지를 위해 auto로 즉시 이동
    setMode('guiding');
    setShowBubble(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    if (stepsRef.current.length > 0) {
      // 스크롤 순간 이동 완료 후 가이드 시작
      setTimeout(() => goToStep(0), 100);
    }
  }, [goToStep]);

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
    const next = currentStepRef.current + 1;
    const currentSteps = stepsRef.current;
    if (next < currentSteps.length) {
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
  }, [goToStep]);

  /** 이전 스텝 (타겟 없는 스텝은 건너뜀) */
  const prevStep = useCallback(() => {
    const activeStep = currentStepRef.current;
    const currentSteps = stepsRef.current;
    for (let i = activeStep - 1; i >= 0; i--) {
      const el = document.querySelector(currentSteps[i].target);
      if (el) {
        goToStep(i);
        return;
      }
    }
  }, [goToStep]);

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
    const currentMode = modeRef.current;
    if (currentMode === 'guiding' || currentMode === 'asking') return;

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
  }, []);

  /** 축소 모드에서 재시작 */
  const restartGuide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      const charSize = isMobile ? 70 : CHARACTER_SIZE;

      const pos = {
        x: Math.max(16, Math.min(window.innerWidth - charSize - 16, rect.left + rect.width / 2 - charSize / 2)),
        y: Math.max(16, Math.min(window.innerHeight - charSize - 16, rect.top + rect.height - charSize)),
      };
      askUser(pos);
    } else {
      askUser();
    }
  }, [askUser]);

  // 페이지 로드 시 자동 질문 (첫 방문만)
  // ⚠️ 채팅 중(chatting)이면 가이드 자동 시작/모드 변경을 하지 않음
  useEffect(() => {
    if (hasAsked.current) return;
    if (steps.length === 0) return;

    const isHidden = localStorage.getItem(HIDDEN_KEY) === 'true';
    if (isHidden) {
      setMode('hidden');
      return;
    }

    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      hasAsked.current = true;
      // 기존 타이머 취소
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // 채팅 중이면 가이드 질문 팝업 건너뜀 (800ms 뒤 현재 mode 재확인)
      timeoutRef.current = setTimeout(() => {
        if (modeRef.current === 'chatting') return;
        askUser(); // askUser는 이제 재생성되지 않는 고정 함수
      }, 800);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      // 채팅 중이면 minimized로 내리지 않음
      setMode(prev => prev === 'chatting' ? 'chatting' : 'minimized');
    }
  }, [pathname, steps.length, askUser]);

  /** 채팅 모드 시작 */
  const startChat = useCallback(() => {
    setMode('chatting');
    setShowBubble(false);
    setHighlightRect(null);
    setBotState('idle');

    // 현재 캐릭터 위치를 기반으로 대화창 위치 소환!
    const isMobile = window.innerWidth <= 768;
    const charCenterX = positionRef.current.x + (isMobile ? 35 : 60);
    const idealX = charCenterX - chatSize.width / 2;
    const idealY = positionRef.current.y - chatSize.height - 16;

    setChatPosition({
      x: Math.max(16, Math.min(window.innerWidth - chatSize.width - 16, idealX)),
      y: Math.max(16, Math.min(window.innerHeight - chatSize.height - 16, idealY)),
    });

    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'bot',
        content: FARM_BOT_CONSTANTS.WELCOME_MESSAGE,
      }]);
    }
  }, [chatMessages.length, chatSize.width, chatSize.height]);

  /** 드래그 시작 (헤더 mousedown) */
  const onChatDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: chatPosition.x,
      posY: chatPosition.y,
    };
  }, [chatPosition]);

  /** 리사이즈 시작 (핸들 mousedown) */
  const onChatResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      w: chatSize.width,
      h: chatSize.height,
    };
  }, [chatSize]);

  // ── 드래그 & 리사이즈 전역 마우스 이벤트 바인딩 ──
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (ev: MouseEvent) => {
      if (isDragging) {
        const dx = ev.clientX - dragStartRef.current.mouseX;
        const dy = ev.clientY - dragStartRef.current.mouseY;
        setChatPosition({
          x: Math.max(0, Math.min(window.innerWidth - chatSize.width, dragStartRef.current.posX + dx)),
          y: Math.max(0, Math.min(window.innerHeight - chatSize.height, dragStartRef.current.posY + dy)),
        });
      } else if (isResizing) {
        const dw = ev.clientX - resizeStartRef.current.mouseX;
        const dh = ev.clientY - resizeStartRef.current.mouseY;
        setChatSize({
          width: Math.max(300, Math.min(1400, resizeStartRef.current.w + dw)),
          height: Math.max(400, Math.min(1300, resizeStartRef.current.h + dh)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, chatSize]);

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
    if (mode === 'guiding') {
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
    chatPosition,
    chatSize,
    onChatDragStart,
    onChatResizeStart,
  };
}
