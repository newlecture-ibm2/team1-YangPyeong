import { useState } from 'react';
import Badge from '@/components/common/Badge/Badge';
import styles from './Timeline.module.css';

export type HistoryType = 'USER' | 'WEATHER' | 'SYSTEM';

export interface CultivationHistory {
  id: number;
  farmId: number;
  historyType: HistoryType;
  content: string;
  createdAt: string;
}

interface TimelineProps {
  histories: CultivationHistory[];
  onEdit?: (historyId: number, content: string) => void;
  onDelete?: (historyId: number) => void;
}

export default function Timeline({ histories, onEdit, onDelete }: TimelineProps) {
  const [filter, setFilter] = useState<HistoryType | 'ALL'>('ALL');

  const filteredHistories = histories.filter(
    (h) => filter === 'ALL' || h.historyType === filter
  );

  const getTheme = (type: HistoryType) => {
    switch (type) {
      case 'USER':
        return { icon: '🌱', badgeName: '사용자 기록', variant: 'green' as const, dotClass: styles.dotUser };
      case 'WEATHER':
        return { icon: '☁️', badgeName: '날씨/환경', variant: 'blue' as const, dotClass: styles.dotWeather };
      case 'SYSTEM':
        return { icon: '🤖', badgeName: '시스템 알림', variant: 'purple' as const, dotClass: styles.dotSystem };
    }
  };

  return (
    <div className={styles.container}>
      {/* 필터 그룹 */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' }}>

        <button
          className={filter === 'ALL' ? styles.filterActive : styles.filterLink}
          onClick={() => setFilter('ALL')}
        >
          전체보기
        </button>
        <button
          className={filter === 'USER' ? styles.filterActive : styles.filterLink}
          onClick={() => setFilter('USER')}
        >
          🌱 사용자 기록
        </button>
        <button
          className={filter === 'WEATHER' ? styles.filterActive : styles.filterLink}
          onClick={() => setFilter('WEATHER')}
        >
          ☁️ 날씨/환경
        </button>
        <button
          className={filter === 'SYSTEM' ? styles.filterActive : styles.filterLink}
          onClick={() => setFilter('SYSTEM')}
        >
          🤖 시스템 알림
        </button>
      </div>

      {/* 타임라인 */}
      <div className={styles.timeline}>
        {filteredHistories.length === 0 ? (
          <p className={styles.empty}>해당 카테고리의 기록이 없습니다.</p>
        ) : (
          filteredHistories.map((history) => {
            const theme = getTheme(history.historyType);
            const dateStr = new Date(history.createdAt).toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={history.id} className={styles.item}>
                {/* 점과 수직선 표시 */}
                <div className={`${styles.dot} ${theme.dotClass}`}>
                  {theme.icon}
                </div>
                
                {/* 카드 내용 */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.headerInfo}>
                      <span className={styles.date}>{dateStr}</span>
                      <Badge variant={theme.variant}>{theme.badgeName}</Badge>
                    </div>
                    
                    {/* 사용자 기록일 경우에만 수정/삭제 버튼 표시 */}
                    {history.historyType === 'USER' && (
                      <div className={styles.actions}>
                        <button 
                          className={styles.actionBtn} 
                          onClick={() => onEdit?.(history.id, history.content)}
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${styles.delete}`} 
                          onClick={() => onDelete?.(history.id)}
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={styles.content}>{history.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

