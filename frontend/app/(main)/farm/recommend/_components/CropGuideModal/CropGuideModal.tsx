/* CropGuideModal — 재배 가이드 상세 전문 가이드북 모달 */

'use client';

import Modal from '@/components/common/Modal/Modal';
import type { CropDetailedGuide } from '../../_lib/cropGuideData';
import CropGuideTopics from '../CropGuideTopics/CropGuideTopics';
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
        <CropGuideTopics guide={guide} loading={loading} />
      </div>
    </Modal>
  );
}
