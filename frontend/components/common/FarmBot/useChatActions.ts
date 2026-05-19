/* ════════════════════════════════════════════════════════
   FarmBot — Chat Action Dispatcher
   AI 서버가 보낸 ChatAction[] 을 프론트에서 실제 동작으로 실행.

   사용:
     const dispatch = useChatActions();
     dispatch(actions);   // 즉시 실행형 액션만 처리

   CLARIFY / CONFIRM 은 채팅 메시지에 그대로 보관해 UI에서 옵션 버튼으로 렌더.
   ════════════════════════════════════════════════════════ */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import type { ChatAction } from '@/lib/chat-types';
import { useToast } from '@/components/common/Toast/ToastContext';

/** sessionStorage 키 prefix — FILL_FORM 페이로드 보관용 */
export const CHAT_FILL_PREFIX = 'chat-fill:';

/** 페이지/컴포넌트가 구독할 커스텀 이벤트 이름 */
export const CHAT_EVENTS = {
  fillForm: 'chat:fill-form',
  refresh: 'chat:refresh',
  openModal: 'chat:open-modal',
} as const;

export interface ChatFillEventDetail {
  target: string;
}

export interface ChatRefreshEventDetail {
  scope: string;
}

export interface ChatOpenModalEventDetail {
  modal: string;
  payload?: Record<string, unknown>;
}

/**
 * 즉시 실행형 액션 디스패처.
 * CLARIFY/CONFIRM 은 채팅 UI에서 직접 렌더하므로 여기서는 무시.
 */
export function useChatActions() {
  const router = useRouter();
  const toast = useToast();

  return useCallback(
    (actions: ChatAction[] | undefined | null) => {
      if (!actions || actions.length === 0) return;

      for (const action of actions) {
        switch (action.type) {
          case 'NAVIGATE': {
            if (!action.url) break;
            if (action.replace) router.replace(action.url);
            else router.push(action.url);
            break;
          }

          case 'FILL_FORM': {
            if (!action.target) break;
            try {
              sessionStorage.setItem(
                `${CHAT_FILL_PREFIX}${action.target}`,
                JSON.stringify(action.payload ?? {}),
              );
              window.dispatchEvent(
                new CustomEvent<ChatFillEventDetail>(CHAT_EVENTS.fillForm, {
                  detail: { target: action.target },
                }),
              );
            } catch (e) {
              console.warn('[ChatActions] FILL_FORM 저장 실패:', e);
            }
            break;
          }

          case 'TOAST': {
            const message = action.message ?? '';
            if (!message) break;
            const level = action.level ?? 'info';
            if (level === 'success') toast.success(message);
            else if (level === 'error') toast.error(message);
            else toast.info(message);
            break;
          }

          case 'REFRESH': {
            if (!action.scope) break;
            window.dispatchEvent(
              new CustomEvent<ChatRefreshEventDetail>(CHAT_EVENTS.refresh, {
                detail: { scope: action.scope },
              }),
            );
            break;
          }

          case 'OPEN_MODAL': {
            if (!action.modal) break;
            window.dispatchEvent(
              new CustomEvent<ChatOpenModalEventDetail>(CHAT_EVENTS.openModal, {
                detail: { modal: action.modal, payload: action.payload },
              }),
            );
            break;
          }

          // CLARIFY / CONFIRM / PRODUCT_LIST 는 UI 렌더 단계에서 처리 (즉시 실행 없음)
          case 'CLARIFY':
          case 'CONFIRM':
          case 'PRODUCT_LIST':
            break;

          default:
            // 알 수 없는 타입은 무시
            break;
        }
      }
    },
    [router, toast],
  );
}

/** FILL_FORM 페이로드를 sessionStorage에서 꺼내고 정리 */
export function consumeChatFillPayload<T = Record<string, unknown>>(
  target: string,
): T | null {
  if (typeof window === 'undefined') return null;
  const key = `${CHAT_FILL_PREFIX}${target}`;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
