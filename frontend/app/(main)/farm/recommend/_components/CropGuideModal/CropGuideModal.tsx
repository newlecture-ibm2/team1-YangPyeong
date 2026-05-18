/* CropGuideModal — 재배 가이드 상세 전문 가이드북 모달 */

'use client';

import Modal from '@/components/common/Modal/Modal';
import type { CropDetailedGuide } from '../../_lib/cropGuideData';
import styles from './CropGuideModal.module.css';

interface CropGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: CropDetailedGuide;
}

export default function CropGuideModal({ isOpen, onClose, guide }: CropGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`📖 ${guide.cropName} 전문 재배 가이드북`} size="lg">
      <div className={styles.container}>
        {/* 상단 소개 */}
        <div className={styles.intro}>
          <p>
            <strong>{guide.cropName}</strong>를 성공적으로 재배하기 위한 전문 가이드입니다.
            토양 관리부터 병해충 대책, 초보 농부를 위한 실패 방지 팁까지 상세하게 안내합니다.
          </p>
        </div>

        {/* 토픽별 섹션 */}
        <div className={styles.topics}>
          {guide.topics.map((topic, idx) => (
            <div key={idx} className={styles.topicCard}>
              <div className={styles.topicHeader}>
                <span className={styles.topicIcon}>{topic.icon}</span>
                <h3 className={styles.topicTitle}>{topic.title}</h3>
              </div>
              <ul className={styles.topicList}>
                {topic.content.map((line, lIdx) => (
                  <li key={lIdx} className={styles.topicItem}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className={styles.footer}>
          <p>📚 이 가이드는 농촌진흥청 및 양평군 농업기술센터 자료를 참고하여 작성되었습니다. 작물별 세부 사항은 지역 기후와 토양에 따라 달라질 수 있습니다.</p>
        </div>
      </div>
    </Modal>
  );
}
