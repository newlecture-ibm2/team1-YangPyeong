'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';
import type { SpeechState } from '@/lib/hooks/useSpeechToText';
import styles from './VoiceInputButton.module.css';

interface VoiceInputButtonProps {
  state: SpeechState;
  remainSec?: number;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

const LABEL: Record<SpeechState, string> = {
  idle: '음성으로 입력',
  recording: '녹음 중지',
  processing: '분석 중...',
  done: '음성으로 입력',
  error: '다시 시도',
};

export default function VoiceInputButton({
  state,
  remainSec,
  onToggle,
  disabled = false,
  className = '',
}: VoiceInputButtonProps) {
  const isProcessing = state === 'processing';
  const isRecording = state === 'recording';
  const isDisabled = disabled || isProcessing;

  return (
    <button
      type="button"
      className={[
        styles.btn,
        styles[`btn--${state}`],
        className,
      ].filter(Boolean).join(' ')}
      onClick={onToggle}
      disabled={isDisabled}
      aria-label={LABEL[state]}
    >
      <span className={styles.icon}>
        {isProcessing ? (
          <Loader2 size={18} className={styles.spin} />
        ) : isRecording ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
      </span>
      <span className={styles.label}>{LABEL[state]}</span>
      {isRecording && remainSec !== undefined && (
        <span className={styles.timer}>{remainSec}s</span>
      )}
    </button>
  );
}
