'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export interface UseSpeechToTextOptions<T> {
  endpoint: string;
  extraFields?: Record<string, string>;
  onResult: (data: T) => void;
  onError?: (message: string) => void;
  maxRecordSec?: number;
  /** 마지막 음성 인식 후 자동 종료까지 침묵 허용 시간(ms). 기본 7000ms */
  silenceTimeoutMs?: number;
}

export function useSpeechToText<T>({
  endpoint,
  extraFields,
  onResult,
  onError,
  maxRecordSec = 60,
  silenceTimeoutMs = 7000,
}: UseSpeechToTextOptions<T>) {
  const [state, setState] = useState<SpeechState>('idle');
  const [remainSec, setRemainSec] = useState(maxRecordSec);

  // P16 — 언마운트 시 cleanup을 위한 ref
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      _cleanup();
    };
  }, []);

  function _cleanup() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    abortRef.current?.abort();
    recognitionRef.current?.stop();
    recorderRef.current = null;
    streamRef.current = null;
    timerRef.current = null;
    silenceTimerRef.current = null;
    abortRef.current = null;
    recognitionRef.current = null;
  }

  function _startCountdown() {
    setRemainSec(maxRecordSec);
    timerRef.current = setInterval(() => {
      setRemainSec((prev) => {
        if (prev <= 1) {
          _stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function _stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    recognitionRef.current?.stop();
  }

  async function _sendText(text: string) {
    setState('processing');
    const form = new FormData();
    form.append('text', text);
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
    }
    await _callEndpoint(form);
  }

  async function _sendAudio(blob: Blob) {
    setState('processing');
    const form = new FormData();
    form.append('audio', blob, 'recording.webm');
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
    }
    await _callEndpoint(form);
  }

  async function _callEndpoint(form: FormData) {
    abortRef.current = new AbortController();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: form,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `서버 오류 (${res.status})`);
      }

      const data: T = await res.json();
      onResult(data);
      setState('done');
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const message = e instanceof Error ? e.message : '오류가 발생했습니다.';
      onError?.(message);
      setState('error');
    } finally {
      abortRef.current = null;
    }
  }

  function _startWebSpeech() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return false;

    const rec = new SpeechRecognitionCtor();
    rec.lang = 'ko-KR';
    // continuous = true: 짧은 침묵 후 자동 종료되지 않고 사용자가 직접 멈출 때까지 계속 인식
    // (느린 화자나 중간에 잠깐 쉬는 경우 대응)
    rec.continuous = true;
    rec.interimResults = false; // 최종 결과만 수집

    // 누적된 최종 인식 텍스트 조각
    const transcriptParts: string[] = [];
    // onerror / onend 중복 처리 방지 플래그
    let hasError = false;
    let hasProcessed = false;

    /** 침묵 타이머 리셋 — 마지막 음성으로부터 silenceTimeoutMs 후 자동 종료 */
    function _resetSilenceTimer() {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
      }, silenceTimeoutMs);
    }

    rec.onstart = () => {
      setState('recording');
      _startCountdown();
      _resetSilenceTimer(); // 녹음 시작 직후부터 침묵 카운트 시작
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      // continuous 모드에서는 결과가 누적됨 — resultIndex부터 순회하여 최종(isFinal) 결과만 수집
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptParts.push(event.results[i][0].transcript);
        }
      }
      // 음성이 들어올 때마다 침묵 타이머 초기화
      _resetSilenceTimer();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      hasError = true;
      _cleanup();
      if (event.error === 'not-allowed') {
        onError?.('마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
      } else {
        onError?.('음성 인식에 실패했습니다. 다시 시도해주세요.');
      }
      setState('idle');
    };

    rec.onend = () => {
      // onerror가 먼저 처리했거나 이미 처리된 경우 무시
      if (hasError || hasProcessed) return;
      hasProcessed = true;
      _cleanup();
      const fullText = transcriptParts.join(' ').trim();
      if (fullText) {
        _sendText(fullText);
      } else {
        onError?.('음성이 인식되지 않았습니다. 다시 시도해주세요.');
        setState('idle');
      }
    };

    recognitionRef.current = rec;
    rec.start();
    return true;
  }

  async function _startMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        _sendAudio(blob);
      };

      recorder.onerror = () => {
        _cleanup();
        onError?.('녹음 중 오류가 발생했습니다.');
        setState('idle');
      };

      recorder.start();
      setState('recording');
      _startCountdown();
    } catch (e: unknown) {
      const msg = e instanceof Error && e.name === 'NotAllowedError'
        ? '마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.'
        : '마이크를 사용할 수 없습니다.';
      onError?.(msg);
      setState('idle');
    }
  }

  const toggle = useCallback(() => {
    if (state === 'recording') {
      // 녹음 중 → 정지
      _stopRecording();
      return;
    }

    if (state !== 'idle' && state !== 'done' && state !== 'error') return;

    setState('idle');

    const hasWebSpeech =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    if (hasWebSpeech) {
      _startWebSpeech();
    } else {
      _startMediaRecorder();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, remainSec, toggle };
}
