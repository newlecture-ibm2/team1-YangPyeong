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
