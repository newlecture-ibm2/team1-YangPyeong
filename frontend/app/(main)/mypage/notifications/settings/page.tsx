'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { notificationApi } from '../_lib/notification.api';
import {
  NotificationPreference,
  NotificationPreferenceUpdateRequest,
} from '../_lib/notification.types';
import styles from './page.module.css';

type PreferenceKey = keyof NotificationPreference;

interface ToggleItem {
  key: PreferenceKey;
  icon: string;
  label: string;
  subLabel: string;
}

const GENERAL_TOGGLES: ToggleItem[] = [
  {
    key: 'balanceWarnEnabled',
    icon: '🚨',
    label: '수급 알림',
    subLabel: '작물 공급 과잉/부족 경고',
  },
  {
    key: 'policyEnabled',
    icon: '📢',
    label: '정책 알림',
    subLabel: '재배 작물 매칭 지원 정책 안내',
  },
  {
    key: 'orderEnabled',
    icon: '📦',
    label: '주문/배송 알림',
    subLabel: '주문 접수, 결제, 배송 상태 변경',
  },
  {
    key: 'systemEnabled',
    icon: '⚙️',
    label: '시스템 알림',
    subLabel: '농장 승인/반려, 댓글, AI 추천 완료 등',
  },
];

const GUIDE_TOGGLES: ToggleItem[] = [
  {
    key: 'guideWeatherEnabled',
    icon: '🌦️',
    label: '기상 알림',
    subLabel: '서리·폭염·집중호우·가뭄·고습 자동 안내',
  },
  {
    key: 'guideScheduleEnabled',
    icon: '🌱',
    label: '재배 일정 알림',
    subLabel: '이달의 주요 농작업 · 수확 적기 안내',
  },
  {
    key: 'guidePestEnabled',
    icon: '🐛',
    label: '병해충 알림',
    subLabel: '작물별 월별 병해충 발생 주의보',
  },
  {
    key: 'guideSoilEnabled',
    icon: '🌍',
    label: '토양 알림',
    subLabel: '토양 pH·유기물 부적합 시 시비 권고',
  },
];

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [preference, setPreference] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    notificationApi
      .getPreferences()
      .then((pref) => {
        if (mounted) setPreference(pref);
      })
      .catch(() => {
        if (mounted) setError('알림 설정을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 즉시 반영: 토글 → 낙관적 UI 업데이트 + 서버 PATCH
  const handleToggle = useCallback(
    async (key: PreferenceKey, value: boolean) => {
      if (!preference) return;
      const next = { ...preference, [key]: value };
      setPreference(next);
      setIsSaving(true);
      setError(null);
      try {
        const updateRequest: NotificationPreferenceUpdateRequest = { [key]: value };
        const saved = await notificationApi.updatePreferences(updateRequest);
        setPreference(saved);
      } catch {
        // 실패 시 롤백
        setPreference(preference);
        setError('설정 저장에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSaving(false);
      }
    },
    [preference]
  );

  if (isLoading) {
    return (
      <Card>
        <Spinner message="알림 설정을 불러오는 중입니다..." />
      </Card>
    );
  }

  if (!preference) {
    return (
      <Card>
        <div className={styles.container}>
          <p>{error ?? '알림 설정을 불러올 수 없습니다.'}</p>
          <Button variant="ghost" onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>
      </Card>
    );
  }

  const renderToggle = (item: ToggleItem) => (
    <label key={item.key} className={styles.row}>
      <div className={styles.rowInfo}>
        <span className={styles.icon} aria-hidden>
          {item.icon}
        </span>
        <div className={styles.labelGroup}>
          <span className={styles.label}>{item.label}</span>
          <span className={styles.subLabel}>{item.subLabel}</span>
        </div>
      </div>
      <span className={styles.switch}>
        <input
          type="checkbox"
          checked={preference[item.key]}
          disabled={isSaving}
          onChange={(e) => handleToggle(item.key, e.target.checked)}
          aria-label={item.label}
        />
        <span className={styles.slider} />
      </span>
    </label>
  );

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>알림 설정</h2>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>

        <p className={styles.description}>
          알림을 끄면 해당 카테고리 알림은 알림 내역과 푸시 알림 모두 수신되지 않습니다.
        </p>

        <h3 className={styles.sectionTitle}>일반 알림</h3>
        <div className={styles.list}>{GENERAL_TOGGLES.map(renderToggle)}</div>

        <h3 className={styles.sectionTitle}>영농 가이드</h3>
        <div className={styles.list}>{GUIDE_TOGGLES.map(renderToggle)}</div>

        <div className={styles.footer}>
          {isSaving ? (
            <span className={styles.savingIndicator}>저장 중...</span>
          ) : error ? (
            <span style={{ color: '#d32f2f' }}>{error}</span>
          ) : (
            <span>변경 사항은 자동으로 저장됩니다.</span>
          )}
        </div>
      </div>
    </Card>
  );
}
