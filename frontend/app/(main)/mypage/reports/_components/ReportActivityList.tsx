import type { MyReportActivity } from '../../_lib/community-activity.types';
import { REPORT_STATUS_LABEL } from '../_lib/constants';
import styles from '../page.module.css';

interface ReportActivityListProps {
  items: MyReportActivity[];
}

export default function ReportActivityList({ items }: ReportActivityListProps) {
  return (
    <>
      {items.map(report => (
        <div key={report.reportId} className={styles.item}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              [{report.targetType}] {report.targetTitle}
            </h3>
          </div>
          <div className={styles.meta}>사유: {report.reason}</div>
          <div className={styles.meta}>
            상태: {REPORT_STATUS_LABEL[report.status] ?? report.status} · {new Date(report.createdAt).toLocaleString('ko-KR')}
          </div>
        </div>
      ))}
    </>
  );
}
