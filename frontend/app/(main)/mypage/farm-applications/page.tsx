'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Badge from '@/components/common/Badge/Badge';
import { useMyFarms } from '../../farm/useFarm';
import styles from './page.module.css';

export default function FarmApplicationsPage() {
  const router = useRouter();
  const { farms, isLoading } = useMyFarms();

  if (isLoading) {
    return <div className={styles.container}><p style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>농장 등록 내역</h1>
        <p className={styles.subtitle}>신청하신 농장의 심사 진행 상태를 확인할 수 있습니다.</p>
      </div>

      <div className={styles.content}>
        {farms.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>신청 내역이 없습니다.</p>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>새로운 농장을 등록하고 서비스를 이용해보세요.</p>
            <Link href="/farm/register">
              <Button variant="primary">농장 등록하기</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {farms.map((farm) => (
              <div 
                key={farm.id} 
                className={`${styles.card} ${farm.certificationStatus === 'APPROVED' ? styles.clickable : ''}`}
                onClick={() => {
                  if (farm.certificationStatus === 'APPROVED') {
                    router.push('/farm');
                  }
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleArea}>
                    <h2 className={styles.cardTitle}>{farm.name}</h2>
                    <span className={styles.cardDate}>면적: {farm.area.toLocaleString()}㎡ ({Math.round(farm.area / 3.3058)}평)</span>
                  </div>
                  <Badge 
                    variant={
                      farm.certificationStatus === 'APPROVED' ? 'green' : 
                      farm.certificationStatus === 'REJECTED' ? 'red' : 'orange'
                    }
                  >
                    {farm.certificationStatus === 'APPROVED' ? '승인 완료' : 
                     farm.certificationStatus === 'REJECTED' ? '반려됨' : '심사 대기중'}
                  </Badge>
                </div>
                
                <div className={styles.cardBody}>
                  <p className={styles.address}>{farm.address}</p>
                  <p className={styles.crops}>주요 작물: {farm.cropNames.length > 0 ? farm.cropNames.join(', ') : '없음'}</p>
                  
                  {farm.certificationStatus === 'REJECTED' && (
                    <div className={styles.rejectBox}>
                      <p className={styles.rejectTitle}>⚠️ 반려 사유</p>
                      <p className={styles.rejectReason}>{farm.rejectReason || '사유가 입력되지 않았습니다. 관리자에게 문의해주세요.'}</p>
                      <div className={styles.actionArea}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            router.push(`/farm/${farm.id}/edit`);
                          }}
                        >
                          내용 수정 후 재심사 요청
                        </Button>
                      </div>
                    </div>
                  )}

                  {farm.certificationStatus === 'APPROVED' && (
                    <div className={styles.actionArea}>
                      <span className={styles.linkText}>내 농장 관리로 이동 &rarr;</span>
                    </div>
                  )}

                  {farm.certificationStatus === 'PENDING' && (
                    <div className={styles.actionArea}>
                      <span className={styles.pendingText}>관리자가 정보를 확인하고 있습니다. 승인 후 수정이 가능합니다.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
