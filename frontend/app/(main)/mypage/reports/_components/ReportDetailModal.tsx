import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import type { MyReportActivity } from '../../_lib/community-activity.types';
import { REPORT_STATUS_LABEL } from '../_lib/constants';
import styles from './ReportDetailModal.module.css';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MyReportActivity | null;
}

export default function ReportDetailModal({ isOpen, onClose, report }: ReportDetailModalProps) {
  const router = useRouter();

  if (!isOpen || !report) return null;

  const handleGoToPost = () => {
    if (report.targetPostId) {
      router.push(`/community/${report.targetPostId}`);
      onClose();
    } else if (report.targetType === 'POST') {
      router.push(`/community/${report.targetId}`);
      onClose();
    }
  };

  const hasPostLink = !!report.targetPostId || report.targetType === 'POST';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="신고 상세 내역" size="md">
      <div className={styles.container}>
        <div className={styles.section}>
          <div className={styles.label}>신고 대상 ({report.targetType === 'POST' ? '게시글' : '댓글'})</div>
          <div className={styles.contentBox}>{report.targetTitle}</div>
        </div>
        <div className={styles.section}>
          <div className={styles.label}>신고 사유</div>
          <div className={styles.contentBox}>{report.reason}</div>
        </div>
        <div className={styles.metaRow}>
          <span>상태: {REPORT_STATUS_LABEL[report.status] ?? report.status}</span>
          <span>일시: {new Date(report.createdAt).toLocaleString('ko-KR')}</span>
        </div>
        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {hasPostLink && (
            <Button variant="primary" onClick={handleGoToPost}>
              원문 보기
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
