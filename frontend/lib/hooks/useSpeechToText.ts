'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export interface UseSpeechToTextOptions<T> {
  endpoint: string;
  extraFields?: Record<string, string>;
  onResult: (data: T) => void;
  onError?: (message: string) => void;
  maxRecordSec?: number;
}

export function useSpeechToText<T>({
  endpoint,
  extraFields,
  onResult,
  onError,
  maxRecordSec = 60,
}: UseSpeechToTextOptions<T>) {
  const [state, setState] = useState<SpeechState>('idle');
  const [remainSec, setRemainSec] = useState(maxRecordSec);

  // P16 — 언마운트 시 cleanup을 위한 ref
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    abortRef.current?.abort();
    recognitionRef.current?.stop();
    recorderRef.current = null;
    streamRef.current = null;
    timerRef.current = null;
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
    rec.continuous = false;
    rec.interimResults = false; // P18 — 중간 결과 비활성화

    rec.onstart = () => {
      setState('recording');
      _startCountdown();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      const text: string = event.results[0]?.[0]?.transcript ?? '';
      _cleanup();
      if (text.trim()) {
        _sendText(text);
      } else {
        onError?.('음성이 인식되지 않았습니다. 다시 시도해주세요.');
        setState('idle');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      _cleanup();
      if (event.error === 'not-allowed') {
        onError?.('마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
      } else {
        onError?.('음성 인식에 실패했습니다. 다시 시도해주세요.');
      }
      setState('idle');
    };

    rec.onend = () => {
      if (timerRef.current) _stopRecording();
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
