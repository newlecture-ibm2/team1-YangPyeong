'use client';

import React, { useState, Fragment, useRef, useEffect } from 'react';
import styles from './GovAiPanel.module.css';
import { useGovUser } from '@/app/gov/useGovUser';
import { askLocalGovAi } from '@/app/gov/_lib/ai.api';
import { ChatMessage } from '@/app/gov/_lib/ai.types';

export default function GovAiPanel() {
  const { user, loading: userLoading } = useGovUser();
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const region = user?.regionName || process.env.NEXT_PUBLIC_DEFAULT_GOV_REGION || '양평군';

  const suggestions = [
    `수급 요약`,
    `과잉 품목 분석`,
    `부족 품목 대응`,
    `배추 위험도`
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;

    // TODO: 향후 dashboard_context를 함께 보내는 구조로 확장
    // const dashboardContext = { ... }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsLoading(true);

    try {
      // 프롬프트에 지역명을 추가해서 보냄
      const fullMessage = `${region} ${msg}`;
      const response = await askLocalGovAi(fullMessage);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.answer,
        timestamp: Date.now(),
        sources: response.graph_summary?.sources || [],
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: err.message || "분석 요청에 실패했습니다.",
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.aiPanel}>
      <div className={styles.header}>
        <h2 className={styles.title}>🤖 FarmBalance AI 분석</h2>
      </div>

      <div className={styles.chatBox} ref={chatBoxRef}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: "center", color: "#6B7280", margin: "auto 0" }}>
            AI에게 궁금한 점을 물어보세요.<br />(예: 배추 위험도 알려줘)
          </div>
        )}
        {chatHistory.map((msg) => (
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
                    <ul style={{ marginTop: "8px", paddingLeft: "20px", margin: 0 }}>
                      {msg.sources.map((s, idx) => (
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

      <div className={styles.inputArea}>
        <input
          type="text"
          className={styles.input}
          placeholder="분석을 원하는 내용을 입력하세요..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(question)}
          disabled={isLoading || userLoading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => handleSendMessage(question)}
          disabled={isLoading || !question.trim() || userLoading}
        >
          전송
        </button>
      </div>
    </div>
  );
}
