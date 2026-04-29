'use client';

import Link from 'next/link';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import { useMyFarms } from './_hooks/useFarm';
import styles from './page.module.css';

// 임시 KPI 및 활동 데이터 (백엔드 연동 전까지 유지할 데이터 구조)
const MOCK_KPI = {
  totalArea: 0,
  cropCount: 0,
  monthlyRevenue: 0,
  aiScore: 0,
};

// 최근 활동을 위한 타입 및 맵 (필요 시 유지)
type ActivityStatus = 'done' | 'scheduled' | 'checking';
const STATUS_MAP: Record<ActivityStatus, { label: string; variant: 'green' | 'lime' | 'orange' }> = {
  done: { label: '완료', variant: 'green' },
  scheduled: { label: '예정', variant: 'lime' },
  checking: { label: '점검중', variant: 'orange' },
};

export default function FarmDashboardPage() {
  const { farms, isLoading } = useMyFarms();
  
  // 첫 번째 농장을 기본으로 표시 (추후 농장 선택 기능 추가 가능)
  const farm = farms.length > 0 ? farms[0] : null;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 농장이 하나도 없는 경우
  if (farms.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>내 농장 <span className={styles.italic}>관리</span></h1>
            <p className={styles.subtitle}>등록된 농장이 없습니다. 새로운 농장을 등록해 보세요!</p>
          </div>
          <div className={styles.headerButtons}>
            <Link href="/farm/register">
              <Button variant="primary">+ 농장 등록하기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 페이지 헤더 */}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>홈</Link> / 내 농장
          </p>
          <h1 className={styles.title}>내 농장 <span className={styles.italic}>관리</span></h1>
          <p className={styles.subtitle}>{farm?.name}의 현황을 한눈에 확인하세요.</p>
        </div>
        <div className={styles.headerButtons}>
          <Link href="/farm/register">
            <Button variant="outline">+ 농장 추가</Button>
          </Link>
        </div>
      </div>

      {/* KPI 카드 Row (실제 farm 데이터 연동) */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>재배 면적</p>
          <p className={styles.kpiValue}>{farm?.area.toLocaleString()}㎡</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>재배 작물</p>
          <p className={styles.kpiValue}>{farm?.cropTypes.length}종</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>이번 달 수익</p>
          <p className={styles.kpiValue}>₩0M</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>AI 점수</p>
          <p className={styles.kpiValue}>-</p>
        </div>
      </div>

      {/* 벤토 레이아웃: 최근 활동 + 농장 정보 */}
      <div className={styles.bento}>
        {/* 최근 활동 테이블 (현재는 Mock 데이터 없이 빈 상태로 유지) */}
        <div className={styles.bentoMain}>
          <Card>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>최근 활동</h3>
              <Link href="#" className={styles.viewAllLink}>전체보기 →</Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>활동</th>
                    <th>작물</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
                      최근 활동 내역이 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 농장 정보 사이드 카드 (실제 데이터 연동) */}
        <div className={styles.bentoSide}>
          <Card variant="dark">
            <h3 className={styles.farmInfoTitle}>농장 정보</h3>
            <dl className={styles.farmInfoList}>
               <dt>위치</dt>
               <dd>{farm?.address}</dd>
 
               <dt>면적</dt>
               <dd>{farm?.area.toLocaleString()} ㎡</dd>
 
               <dt>주요 작물</dt>
               <dd>{farm?.cropTypes.join(', ')}</dd>
 
               <dt>상태</dt>
               <dd>
                 <Badge variant={farm?.certificationStatus === 'APPROVED' ? 'green' : 'orange'}>
                   {farm?.certificationStatus === 'APPROVED' ? '인증됨' : '심사중'}
                 </Badge>
               </dd>
            </dl>
            <Link href={`/farm/${farm?.id}/edit`} className={styles.editBtnWrap}>
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
                정보 수정
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
