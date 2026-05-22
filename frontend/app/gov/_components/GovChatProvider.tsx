'use client';

/* ════════════════════════════════════════════════════════
   GovChatProvider — GovAiPanel과 GovFloatingChat이
   같은 대화 히스토리를 공유하기 위한 공통 Context
   - layout.tsx 레벨에 mount
   - sessionStorage 기반 복원/저장
   - userId 기반 key 격리
   - pageContext: 현재 페이지가 등록한 화면 데이터를 챗봇 전송에 포함
   ════════════════════════════════════════════════════════ */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useGovUser } from '@/app/gov/useGovUser';
import { askLocalGovAi } from '@/app/gov/_lib/ai.api';
import type { GovPageContext } from '@/app/gov/_lib/ai.api';
import type { ChatMessage } from '@/app/gov/_lib/ai.types';

// ── Storage 유틸 ──
const MAX_STORED_MESSAGES = 50;
const STORAGE_PREFIX = 'gov-chat';

function getStorageKey(userId: number | string | undefined): string {
  return userId ? `${STORAGE_PREFIX}-${userId}` : `${STORAGE_PREFIX}-anonymous`;
}

function loadMessages(userId: number | string | undefined): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return (JSON.parse(raw) as ChatMessage[]).slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function saveMessages(userId: number | string | undefined, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(getStorageKey(userId), JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch { /* storage full — 무시 */ }
}

// ── Context 타입 ──
interface GovChatContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  initialized: boolean;
  /** 메시지 전송 (pageContext를 직접 전달하거나 등록된 것을 자동 사용) */
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  region: string;
  /** 페이지가 자신의 화면 데이터를 등록 (페이지 이동 시 자동 해제) */
  setPageContext: (ctx: GovPageContext | null) => void;
}

const GovChatContext = createContext<GovChatContextValue | null>(null);

/** GovAiPanel / GovFloatingChat 에서 공통 상태에 접근하는 hook */
export function useGovChat(): GovChatContextValue {
  const ctx = useContext(GovChatContext);
  if (!ctx) throw new Error('useGovChat must be used within GovChatProvider');
  return ctx;
}

// ── Provider ──
interface GovChatProviderProps {
  children: React.ReactNode;
}

export function GovChatProvider({ children }: GovChatProviderProps) {
  const { user, loading: userLoading } = useGovUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const userId = user?.id;
  const region = user?.regionName || '양평군';

  // 중복 초기화 방지
  const didInit = useRef(false);

  // ── 페이지 컨텍스트 (각 페이지가 등록) ──
  const pageContextRef = useRef<GovPageContext | null>(null);

  const setPageContext = useCallback((ctx: GovPageContext | null) => {
    pageContextRef.current = ctx;
  }, []);

  // ── 초기 로딩: sessionStorage에서 복원 ──
  useEffect(() => {
    if (!userLoading && user && !didInit.current) {
      didInit.current = true;
      const stored = loadMessages(userId);
      setMessages(stored);
      setInitialized(true);
    }
  }, [userLoading, user, userId]);

  // ── 메시지 변경 시 sessionStorage에 저장 ──
  useEffect(() => {
    if (initialized && userId !== undefined) {
      saveMessages(userId, messages);
    }
  }, [messages, initialized, userId]);

  // ── 메시지 전송 (공통) ──
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // region을 메시지에 포함 + 현재 등록된 pageContext를 함께 전달
      const fullMessage = `${region} ${message}`;
      const currentContext = pageContextRef.current || undefined;
      const response = await askLocalGovAi(fullMessage, currentContext);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.answer,
        timestamp: Date.now(),
        sources: response.graph_summary?.sources || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '분석 요청에 실패했습니다.';
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: errorMessage,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, region]);

  // ── 대화 초기화 ──
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (userId !== undefined) {
      try { sessionStorage.removeItem(getStorageKey(userId)); } catch { /* 무시 */ }
    }
  }, [userId]);

  return (
    <GovChatContext.Provider value={{ messages, isLoading, initialized, sendMessage, clearMessages, region, setPageContext }}>
      {children}
    </GovChatContext.Provider>
  );
}
