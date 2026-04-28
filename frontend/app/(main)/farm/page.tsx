'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import styles from './page.module.css';

// 임시 데이터 (백엔드 FarmJpaEntity 구조 반영)
const MOCK_FARMS = [
  {
    id: 1,
    name: '양평 해맑은 농장',
    address: '경기도 양평군 양서면 양수리 123-4',
    area: 3200,
    cropType: '배추',
    bjdCode: '4183031022',
  },
  {
    id: 2,
    name: '푸른 초장 농원',
    address: '경기도 양평군 용문면 다문리 456',
    area: 1500,
    cropType: '고추',
    bjdCode: '4183035021',
  }
];

export default function FarmListPage() {
  const [farms] = useState(MOCK_FARMS);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>홈 / 내 농장</p>
          <h1 className={styles.title}>내 농장 <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>관리</span></h1>
          <p className={styles.subtitle}>등록된 농장의 현황을 한눈에 확인하세요.</p>
        </div>
        <Link href="/farm/register">
          <Button variant="primary">+ 농장 등록</Button>
        </Link>
      </div>

      {farms.length > 0 ? (
        <div className={styles.grid}>
          {farms.map((farm) => (
            <Card key={farm.id}>
              <div className={styles.farmCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600 }}>{farm.name}</h3>
                  <Badge variant="green">{farm.cropType}</Badge>
                </div>
                
                <div className={styles.farmInfo}>
                  <div className={styles.farmInfoRow}>
                    <span className={styles.farmInfoLabel}>주소</span>
                    <span className={styles.farmInfoValue}>{farm.address}</span>
                  </div>
                  <div className={styles.farmInfoRow}>
                    <span className={styles.farmInfoLabel}>면적</span>
                    <span className={styles.farmInfoValue}>{farm.area.toLocaleString()} ㎡</span>
                  </div>
                  <div className={styles.farmInfoRow}>
                    <span className={styles.farmInfoLabel}>법정동 코드</span>
                    <span className={styles.farmInfoValue}>{farm.bjdCode}</span>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <Button variant="outline" size="sm" style={{ width: '100%' }}>상세 보기</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p style={{ marginBottom: '16px' }}>등록된 농장이 없습니다.</p>
          <Link href="/farm/register">
            <Button variant="primary">첫 농장 등록하기</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
