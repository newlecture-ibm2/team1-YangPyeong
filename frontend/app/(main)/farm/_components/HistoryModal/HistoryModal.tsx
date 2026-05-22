'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import VoiceInputButton from '@/components/common/VoiceInputButton/VoiceInputButton';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';
import styles from './HistoryModal.module.css';

interface FarmHistoryParseResult {
  activities: string[];
  content: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<boolean>;
  farmName: string;
  initialContent?: string;
  mode?: 'create' | 'edit';
}

const ACTIVITIES = [
  '💧 물주기/관수',
  '🔋 비료 살포',
  '🌿 제초 작업',
  '🐛 병해충 방제',
  '✂️ 가지치기',
  '🍎 수확',
  '🔍 토양 점검'
];

export default function HistoryModal({ 
  isOpen, 
  onClose, 
  onSave, 
  farmName, 
  initialContent = '',
  mode = 'create'
}: HistoryModalProps) {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customContent, setCustomContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const applyVoiceResult = useCallback((data: FarmHistoryParseResult) => {
    // 칩: 기존 선택과 합집합 병합 (음성 결과로 기존 선택을 해제하지 않음)
    if (data.activities?.length) {
      const valid = data.activities.filter((a) => ACTIVITIES.includes(a));
      setSelectedActivities((prev) => Array.from(new Set([...prev, ...valid])));
    }
    // textarea: 비어있으면 덮어쓰기, 있으면 줄바꿈으로 이어붙임
    if (data.content) {
      setCustomContent((prev) =>
        prev.trim() === '' ? data.content : `${prev.trimEnd()}\n${data.content}`,
      );
    }
    setVoiceError(null);
  }, []);

  const { state: voiceState, remainSec, toggle: toggleVoice } = useSpeechToText<{ success: boolean; data: FarmHistoryParseResult }>({
    endpoint: '/api/farm/history/parse-voice',
    onResult: (res) => {
      if (res.success && res.data) applyVoiceResult(res.data);
    },
    onError: (msg) => setVoiceError(msg),
  });

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      if (initialContent) {
        const parts = initialContent.split(', ');
        const matched = parts.filter(p => ACTIVITIES.includes(p));
        const unmatched = parts.filter(p => !ACTIVITIES.includes(p)).join(', ');
        
        setSelectedActivities(matched);
        setCustomContent(unmatched);
      } else {
        setSelectedActivities([]);
        setCustomContent('');
      }
    }
  }, [isOpen, initialContent]);

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSave = async () => {
    const finalContent = [
      ...selectedActivities,
      ...(customContent ? [customContent] : [])
    ].join(', ');

    if (!finalContent.trim()) return;
    
    setIsSubmitting(true);
    const success = await onSave(finalContent);
    setIsSubmitting(false);
    
    if (success) {
      onClose();
    }
  };

  const title = mode === 'create' ? '재배 이력 기록하기' : '재배 이력 수정하기';
  const buttonText = mode === 'create' ? '기록 저장하기' : '수정 완료';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.container}>
        <p className={styles.desc}>
          오늘 <strong>{farmName}</strong>에서 수행한 작업을 선택하고 상세 내용을 적어주세요.
        </p>
        
        {/* 선택지 영역 */}
        <div className={styles.inputArea}>
          <label className={styles.label}>주요 농작업 (중복 선택 가능)</label>
          <div className={styles.chipGrid}>
            {ACTIVITIES.map(activity => (
              <button
                key={activity}
                type="button"
                className={`${styles.chip} ${selectedActivities.includes(activity) ? styles.activeChip : ''}`}
                onClick={() => toggleActivity(activity)}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        {/* 상세 내용 영역 (상시 노출) */}
        <div className={styles.inputArea}>
          <div className={styles.labelRow}>
            <label className={styles.label}>상세 내용 및 기타 메모</label>
            <VoiceInputButton
              state={voiceState}
              remainSec={remainSec}
              onToggle={toggleVoice}
              disabled={isSubmitting}
            />
          </div>
          {voiceState === 'recording' && (
            <div className={styles.voiceStatus}>
              <span className={styles.voiceDot} />
              지금 듣고 있어요... 말씀을 마치면 버튼을 다시 눌러주세요.
            </div>
          )}
          {voiceState === 'processing' && (
            <div className={`${styles.voiceStatus} ${styles.voiceStatusProcessing}`}>
              <span className={styles.voiceSpinner} />
              음성을 분석하고 있어요...
            </div>
          )}
          {voiceError && <p className={styles.voiceError}>{voiceError}</p>}
          <textarea
            className={styles.textarea}
            placeholder="예: 유기농 비료 2포대 사용, 특이사항 없음 등"
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
          />
        </div>
        
        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
          <Button variant="primary" onClick={handleSave} disabled={isSubmitting || (!selectedActivities.length && !customContent.trim())}>
            {isSubmitting ? '저장 중...' : buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
