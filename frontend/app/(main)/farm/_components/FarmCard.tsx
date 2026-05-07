/* ════════════════════════════════════════════════════════
   FarmCard 컴포넌트
   농장 목록이나 요약 정보를 보여줄 때 사용합니다.
   ════════════════════════════════════════════════════════ */

import Link from 'next/link';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import { FarmListItem } from '../_lib/farm.types';
import styles from './FarmCard.module.css';

interface FarmCardProps {
  farm: FarmListItem;
  isCompact?: boolean;
}

export default function FarmCard({ farm, isCompact = false }: FarmCardProps) {
  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.name}>{farm.name}</h3>
        <Badge variant="green">운영중</Badge>
      </div>
      
      <p className={styles.address}>{farm.address}</p>
      
      {!isCompact && (
        <div className={styles.cropList}>
          {farm.cropNames.map(crop => (
            <span key={crop} className={styles.cropTag}>#{crop}</span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <Link href={`/farm/${farm.id}/edit`}>
          <Button variant="outline" size="sm">관리</Button>
        </Link>
        <Link href={`/farm/plan?farmId=${farm.id}`}>
          <Button variant="primary" size="sm">계획 수립</Button>
        </Link>
      </div>
    </Card>
  );
}
