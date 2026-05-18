'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useHeaderData } from '@/lib/hooks/useHeaderData';
import { useFCM } from '../Header/useFCM';

type HeaderContextValue = ReturnType<typeof useHeaderData>;

const HeaderContext = createContext<HeaderContextValue | null>(null);

/**
 * 헤더 공유 상태 Provider.
 * - useHeaderData를 한 번만 호출하여 Header / MobileHeader가 함께 공유
 * - useFCM도 여기서 한 번 호출 (양쪽이 따로 호출하지 않도록)
 */
export default function HeaderProvider({ children }: { children: ReactNode }) {
  const data = useHeaderData();
  useFCM(!!data.user);

  return <HeaderContext.Provider value={data}>{children}</HeaderContext.Provider>;
}

/** Provider 안에서만 호출 가능 */
export function useHeaderContext(): HeaderContextValue {
  const ctx = useContext(HeaderContext);
  if (!ctx) {
    throw new Error('useHeaderContext must be used within <HeaderProvider>');
  }
  return ctx;
}
