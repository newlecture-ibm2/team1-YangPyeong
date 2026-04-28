'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import styles from './page.module.css';

// 임시 KPI 데이터
const MOCK_KPI = {
  totalArea: 3200,
  cropCount: 4,
  monthlyRevenue: 2400000,
  aiScore: 87,
};

// 임시 최근 활동 데이터
const MOCK_ACTIVITIES = [
  { id: 1, date: '2026-04-25', activity: '파종 완료', crop: '배추', status: 'done' },
  { id: 2, date: '2026-04-22', activity: '비료 시비', crop: '고추', status: 'done' },
  { id: 3, date: '2026-04-20', activity: '수확 예정', crop: '감자', status: 'scheduled' },
  { id: 4, date: '2026-04-18', activity: '병해충 점검', crop: '토마토', status: 'checking' },
];

// 임시 농장 정보
const MOCK_FARM_INFO = {
  name: '양평 해맑은 농장',
  location: '경기도 양평군 양서면',
  area: '3,200 ㎡',
  soil: '양토 (pH 6.5)',
  registeredAt: '2024-03-15',
};

type ActivityStatus = 'done' | 'scheduled' | 'checking';

const STATUS_MAP: Record<ActivityStatus, { label: string; variant: 'green' | 'lime' | 'orange' }> = {
  done: { label: '완료', variant: 'green' },
  scheduled: { label: '예정', variant: 'lime' },
  checking: { label: '점검중', variant: 'orange' },
};

export default function FarmDashboardPage() {
  const [kpi] = useState(MOCK_KPI);
  const [activities] = useState(MOCK_ACTIVITIES);
  const [farmInfo] = useState(MOCK_FARM_INFO);

  return (
    <div className={styles.container}>
      {/* 페이지 헤더 */}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>홈</Link> / 내 농장
          </p>
          <h1 className={styles.title}>내 농장 <span className={styles.italic}>관리</span></h1>
          <p className={styles.subtitle}>{farmInfo.name}의 현황을 한눈에 확인하세요.</p>
        </div>
        <div className={styles.headerButtons}>
          <Link href="/farm/register">
            <Button variant="outline">+ 농장 추가</Button>
          </Link>
          <Link href="/farm/register">
            <Button variant="primary">+ 작물 추가</Button>
          </Link>
        </div>
      </div>

      {/* KPI 카드 Row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>재배 면적</p>
          <p className={styles.kpiValue}>{kpi.totalArea.toLocaleString()}㎡</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>재배 작물</p>
          <p className={styles.kpiValue}>{kpi.cropCount}종</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>이번 달 수익</p>
          <p className={styles.kpiValue}>₩{(kpi.monthlyRevenue / 1000000).toFixed(1)}M</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>AI 점수</p>
          <p className={styles.kpiValue}>{kpi.aiScore}</p>
        </div>
      </div>

      {/* 벤토 레이아웃: 최근 활동 + 농장 정보 */}
      <div className={styles.bento}>
        {/* 최근 활동 테이블 (8/12) */}
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
                  {activities.map((item) => {
                    const statusInfo = STATUS_MAP[item.status as ActivityStatus];
                    return (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>{item.activity}</td>
                        <td>{item.crop}</td>
                        <td>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 농장 정보 사이드 카드 (4/12) */}
        <div className={styles.bentoSide}>
          <Card variant="dark">
            <h3 className={styles.farmInfoTitle}>농장 정보</h3>
            <dl className={styles.farmInfoList}>
              <dt>위치</dt>
              <dd>{farmInfo.location}</dd>

              <dt>면적</dt>
              <dd>{farmInfo.area}</dd>

              <dt>토양</dt>
              <dd>{farmInfo.soil}</dd>

              <dt>등록일</dt>
              <dd>{farmInfo.registeredAt}</dd>
            </dl>
            <Link href="/farm/register" className={styles.editBtnWrap}>
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
