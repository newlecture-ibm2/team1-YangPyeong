import { useState, useEffect } from 'react';
import { trackOrder } from '../../../shop/_lib/shop.api';
import Spinner from '@/components/common/Spinner/Spinner';
import styles from './TrackingTimeline.module.css';

interface TrackingTimelineProps {
  trackingNumber: string;
}

const TRACKING_STEPS = ['상품인수', '이동중', '배달출발', '배달완료'];

export default function TrackingTimeline({ trackingNumber }: TrackingTimelineProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      setErrorMsg(null);
      const res = await trackOrder(trackingNumber);
      if (res.success && res.data) {
        setEvents(res.data);
      } else {
        setErrorMsg(res.error?.message || '알 수 없는 오류가 발생했습니다.');
      }
      setLoading(false);
    };
    fetchTracking();
  }, [trackingNumber]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}><Spinner /></div>;
  if (errorMsg) return <p className={styles.error}>오류: {errorMsg}</p>;
  if (!events.length) return <p className={styles.empty}>배송 정보가 아직 업데이트되지 않았습니다.</p>;

  // 현재 진행 상태 (1~4)
  const currentStepIndex = Math.min(events.length, 4) - 1;
  const progressWidth = `${(currentStepIndex / (TRACKING_STEPS.length - 1)) * 100}%`;
  
  // 가장 최근 이벤트
  const latestEvent = events[events.length - 1];

  return (
    <div className={styles.container}>
      <h5 className={styles.title}>🚚 배송 추적</h5>
      
      <div className={styles.stepper}>
        <div className={styles.stepperProgress} style={{ width: progressWidth }} />
        {TRACKING_STEPS.map((stepName, idx) => {
          const isActive = idx <= currentStepIndex;
          return (
            <div key={idx} className={`${styles.step} ${isActive ? styles.stepActive : ''}`}>
              <div className={styles.stepIcon}>{isActive ? '✓' : idx + 1}</div>
              <span className={styles.stepLabel}>{stepName}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.latestStatus}>
        <div className={styles.statusHeader}>
          <span className={styles.time}>{latestEvent.time}</span>
          <span className={styles.location}>{latestEvent.location}</span>
        </div>
        <span className={styles.description}>{latestEvent.description}</span>
      </div>
    </div>
  );
}
