/* CropGuideModal — 재배 가이드 상세 전문 가이드북 모달 */

'use client';

import Modal from '@/components/common/Modal/Modal';
import type { CropDetailedGuide } from '../../_lib/cropGuideData';
import styles from './CropGuideModal.module.css';

interface CropGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: CropDetailedGuide;
  loading?: boolean;
}

export default function CropGuideModal({ isOpen, onClose, guide, loading }: CropGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`📖 ${guide.cropName} 전문 재배 가이드북`} size="lg">
      <div className={styles.container}>
        {loading && (
          <p className={styles.loadingBanner}>AI 맞춤 가이드를 생성하고 있습니다…</p>
        )}
        <div className={styles.intro}>
          <p>
            <strong>{guide.cropName}</strong>를 성공적으로 재배하기 위한 전문 가이드입니다.
            토양·수분 관리, 병해충 대책, 실패 방지 팁을 안내합니다.
          </p>
        </div>

        <div className={styles.topics}>
          {guide.topics.map((topic, idx) => (
            <div key={idx} className={styles.topicCard}>
              <div className={styles.topicHeader}>
                <span className={styles.topicIcon}>{topic.icon}</span>
                <h3 className={styles.topicTitle}>{topic.title}</h3>
              </div>
              <ul className={styles.topicList}>
                {topic.content.map((line, lIdx) =>
                  line === '' ? (
                    <li key={lIdx} className={styles.topicSpacer} aria-hidden />
                  ) : (
                    <li
                      key={lIdx}
                      className={
                        line.startsWith('【')
                          ? styles.topicItemPest
                          : line.startsWith('—')
                            ? styles.topicItemSub
                            : styles.topicItem
                      }
                    >
                      {line}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>
            📚 농촌진흥청·지역 농업기술센터 자료를 참고했습니다. 병해충명은 작물·지역에 따라
            달라질 수 있으니 현장 예찰과 병해충 전문 상담을 병행하세요.
          </p>
        </div>
      </div>
    </Modal>
  );
}
