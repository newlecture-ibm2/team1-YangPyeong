'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import styles from './GovFloatingChat.module.css';
import { useGovUser } from '@/app/gov/useGovUser';
import { useGovChat } from '../GovChatProvider';
import type { GraphSource } from '@/app/gov/_lib/ai.types';

/* ════════════════════════════════════════════════════════
   GovFloatingChat — /gov/** 플로팅 챗봇 (대시보드 제외)
   - 공통 GovChatProvider의 상태를 사용
   - /gov (대시보드)에는 표시하지 않음 (인라인 GovAiPanel 존재)
   ════════════════════════════════════════════════════════ */

const SUGGESTIONS = [
  '수급 요약',
  '과잉 품목 분석',
  '부족 품목 대응',
  '배추 위험도',
];

export default function GovFloatingChat() {
  const pathname = usePathname();
  const { user, loading: userLoading } = useGovUser();
  const { messages, isLoading, initialized, sendMessage, clearMessages } = useGovChat();

  // ── 노출 조건 ──
  const isGovPath = pathname.startsWith('/gov');
  // /gov 또는 /gov/ (대시보드)에서는 인라인 GovAiPanel이 있으므로 플로팅 숨김
  const isDashboard = pathname === '/gov' || pathname === '/gov/';
  const isAllowedRole = user?.role === 'GOV' || user?.role === 'ADMIN';
  const shouldShow = isGovPath && !isDashboard && isAllowedRole && !userLoading;

  // ── 패널 열림/닫힘 (로컬 상태, 페이지 이동 시 항상 닫힘) ──
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── 자동 스크롤 ──
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── 패널 열릴 때 입력창 포커스 ──
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ── 전송 ──
  const handleSend = async (msg: string) => {
    if (!msg.trim() || isLoading) return;
    setInput('');
    await sendMessage(msg);
  };

  // ── 미노출 ──
  if (!shouldShow) return null;

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button
          className={styles.floatingButton}
          onClick={() => setIsOpen(true)}
          aria-label="지자체 AI 챗봇 열기"
          title="AI 분석 챗봇"
        >
          <span className={styles.floatingIcon}>🤖</span>
          <span className={styles.floatingPulse} />
        </button>
      )}

      {/* 채팅 패널 */}
      {isOpen && (
        <div className={styles.panel}>
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.headerIcon}>🤖</span>
              <div>
                <h3 className={styles.headerTitle}>FarmBalance AI</h3>
                <p className={styles.headerSub}>지자체 분석 어시스턴트</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.clearBtn}
                onClick={clearMessages}
                title="대화 초기화"
                disabled={messages.length === 0}
              >
                🗑️
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="챗봇 닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className={styles.chatBox} ref={chatBoxRef}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyIcon}>💬</p>
                <p className={styles.emptyText}>
                  AI에게 수급 현황, 작물 분석 등<br />궁금한 점을 물어보세요.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}
              >
                {msg.role === 'ai' ? (
                  <div>
                    <div>
                      {msg.content.split('\n').map((line, i) => (
                        <Fragment key={i}>
                          {line}
                          <br />
                        </Fragment>
                      ))}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <details className={styles.sources}>
                        <summary>분석 근거 ({msg.sources.length}건)</summary>
                        <ul>
                          {msg.sources.map((s: GraphSource, idx: number) => (
                            <li key={idx}>[{s.type}] {s.description}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.aiMessage}`}>
                <div className={styles.loadingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {/* 추천 질문 */}
          {messages.length === 0 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((text, idx) => (
                <button
                  key={idx}
                  className={styles.suggestionBtn}
                  onClick={() => handleSend(text)}
                  disabled={isLoading}
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          {/* 입력 영역 */}
          <div className={styles.inputArea}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="질문을 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  handleSend(input);
                }
              }}
              disabled={isLoading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
