'use client';

import React, { Fragment, useRef, useEffect, useState } from 'react';
import styles from './GovAiPanel.module.css';
import { useGovChat } from '../GovChatProvider';
import type { GraphSource } from '@/app/gov/_lib/ai.types';

/* ════════════════════════════════════════════════════════
   GovAiPanel — 대시보드 인라인 AI 패널
   - 공통 GovChatProvider의 상태를 사용
   - 대시보드에서 나눈 대화가 다른 페이지 플로팅 챗봇에도 공유됨
   ════════════════════════════════════════════════════════ */

export default function GovAiPanel() {
  const { messages, isLoading, sendMessage } = useGovChat();
  const [question, setQuestion] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    '수급 요약',
    '과잉 품목 분석',
    '부족 품목 대응',
    '배추 위험도',
  ];

  // 자동 스크롤
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    setQuestion('');
    await sendMessage(msg);
  };

  return (
    <div className={`${styles.aiPanel} ${isOpen ? styles.aiPanelOpen : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>🤖 FarmBalance AI 분석</h2>
          <button className={styles.mobileToggle} onClick={() => setIsOpen(o => !o)}>
            {isOpen ? '▲ 접기' : '▼ 열기'}
          </button>
        </div>
      </div>

      <div className={styles.chatBody}>
        <div className={styles.chatBox} ref={chatBoxRef}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#6B7280', margin: 'auto 0' }}>
              AI에게 궁금한 점을 물어보세요.<br />(예: 배추 위험도 알려줘)
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
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
                      <summary style={{ cursor: 'pointer', outline: 'none' }}>분석 근거 ({msg.sources.length}건)</summary>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px', margin: 0 }}>
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
          {isLoading && <div className={`${styles.message} ${styles.aiMessage}`}>분석 중입니다...</div>}
        </div>

        <div className={styles.suggestions}>
          {suggestions.map((text, idx) => (
            <button key={idx} className={styles.suggestionBtn} onClick={() => handleSendMessage(text)} disabled={isLoading}>
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          className={styles.input}
          placeholder="분석을 원하는 내용을 입력하세요..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(question)}
          disabled={isLoading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => handleSendMessage(question)}
          disabled={isLoading || !question.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
}
