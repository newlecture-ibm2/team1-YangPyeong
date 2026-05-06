/* ════════════════════════════════════════════════════════
   GuideBot Context — 외부 컴포넌트에서 가이드봇 메시지를 트리거
   사용법: const { showQuickMessage } = useGuideBotContext();
   ════════════════════════════════════════════════════════ */

'use client';

import { createContext, useContext } from 'react';

interface GuideBotContextValue {
  /** 가이드봇이 잠시 말풍선을 보여줍니다 (자동 사라짐) */
  showQuickMessage: (message: string, durationMs?: number) => void;
}

export const GuideBotContext = createContext<GuideBotContextValue>({
  showQuickMessage: () => {},
});

/** 외부 컴포넌트에서 가이드봇 메시지를 트리거할 때 사용 */
export function useGuideBotContext() {
  return useContext(GuideBotContext);
}
