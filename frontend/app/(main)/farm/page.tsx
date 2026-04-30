'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import { useMyFarms } from './_hooks/useFarm';
import { useHistory } from './_hooks/useHistory';
import Timeline from './_components/Timeline/Timeline';
import HistoryModal from './_components/HistoryModal/HistoryModal';
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
  const { farms, isLoading: isFarmsLoading } = useMyFarms();
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'POLICY' | 'HISTORY' | 'REPORT'>('HISTORY');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // 수정을 위한 상태
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // 선택된 농장
  const farm = farms.length > 0 ? farms[selectedFarmIdx] : null;
  
  // 히스토리 데이터 연동
  const { 
    histories, 
    isLoading: isHistoryLoading, 
    addHistory, 
    updateHistory, 
    removeHistory 
  } = useHistory(farm?.id);

  const isLoading = isFarmsLoading;

  // 수정 버튼 클릭 핸들러
  const handleEditClick = (id: number, content: string) => {
    setEditingHistoryId(id);
    setEditingContent(content);
    setIsHistoryModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsHistoryModalOpen(false);
    setEditingHistoryId(null);
    setEditingContent('');
  };

  // 저장/수정 실행 핸들러
  const handleSaveHistory = async (content: string) => {
    if (editingHistoryId) {
      return await updateHistory(editingHistoryId, content);
    } else {
      return await addHistory(content);
    }
  };

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
          <h1 className={styles.title}>{farm?.name} <span className={styles.italic}>현황</span></h1>
          <p className={styles.subtitle}>선택하신 농장의 현황을 한눈에 확인하세요.</p>
          
          {/* 농장 선택 탭 */}
          {farms.length > 0 && (
            <div className={styles.tabs}>
              {farms.map((f, idx) => (
                <button 
                  key={f.id} 
                  className={idx === selectedFarmIdx ? styles.activeTab : styles.tab}
                  onClick={() => setSelectedFarmIdx(idx)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.headerButtons}>
          <Button variant="outline" onClick={() => setIsHistoryModalOpen(true)}>이력 기록하기</Button>
          <Link href="/farm/register">
            <Button variant="primary">+ 새 농장 등록</Button>
          </Link>
        </div>
      </div>

      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={handleModalClose} 
        onSave={handleSaveHistory}
        farmName={farm?.name || ''}
        initialContent={editingContent}
        mode={editingHistoryId ? 'edit' : 'create'}
      />

      {/* KPI 카드 Row */}
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
        <div className={styles.bentoMain}>
          <Card>
            <div className={styles.subTabs}>
              <button 
                className={activeSubTab === 'POLICY' ? styles.activeSubTab : styles.subTab} 
                onClick={() => setActiveSubTab('POLICY')}
              >
                정책/혜택 안내
              </button>
              <button 
                className={activeSubTab === 'HISTORY' ? styles.activeSubTab : styles.subTab} 
                onClick={() => setActiveSubTab('HISTORY')}
              >
                재배 히스토리
              </button>
              <button 
                className={activeSubTab === 'REPORT' ? styles.activeSubTab : styles.subTab} 
                onClick={() => setActiveSubTab('REPORT')}
              >
                AI 분석 리포트
              </button>
            </div>
            
            <div className={styles.tabContent}>
              {activeSubTab === 'POLICY' && (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>
                  {farm?.name} 농가를 위한 맞춤형 정책 및 혜택 정보가 준비 중입니다.
                </div>
              )}
              {activeSubTab === 'HISTORY' && (
                <Timeline 
                  histories={histories} 
                  onEdit={handleEditClick}
                  onDelete={removeHistory}
                />
              )}
              {activeSubTab === 'REPORT' && (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>
                  AI 분석 리포트는 준비 중입니다.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 농장 정보 사이드 카드 */}
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

