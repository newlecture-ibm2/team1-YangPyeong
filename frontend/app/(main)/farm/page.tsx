'use client';

import { useState, useEffect } from 'react';
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
  // 농장 목록 뷰 여부 상태
  const [isListView, setIsListView] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'DASHBOARD' | 'HISTORY' | 'POLICY' | 'REPORT'>('DASHBOARD');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 농장 목록이 로드되었을 때, 2개 이상이면 목록 뷰를 기본으로 설정
  useEffect(() => {
    if (farms.length > 1) {
      setIsListView(true);
    }
  }, [farms]);
  
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
            <h1 className={styles.title}>내 농장 <span className={styles.italic}>선택</span></h1>
            <p className={styles.subtitle}>관리할 농장을 선택하거나 새로운 농장을 등록하세요.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          <Link href="/farm/register" style={{ textDecoration: 'none' }}>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-light)', height: '100%', cursor: 'pointer', transition: 'all 0.2s' }}
                 onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16,185,129,0.02)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>＋</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>새로운 농장 등록하기</div>
              <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>등록된 농장이 없습니다. 농장을 등록해 주세요.</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // 농장 목록 뷰 (농장이 2개 이상일 때)
  if (isListView && farms.length > 1) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>내 농장 <span className={styles.italic}>선택</span></h1>
            <p className={styles.subtitle}>관리할 농장을 선택하거나 새로운 농장을 등록하세요.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }}>
          {farms.map((f, idx) => (
            <div 
              key={f.id}
              onClick={() => { setSelectedFarmIdx(idx); setIsListView(false); }}
              style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', minHeight: '200px' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>{f.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>{f.address}</div>
                </div>
                <Badge variant={f.certificationStatus === 'APPROVED' ? 'green' : 'orange'}>
                  {f.certificationStatus === 'APPROVED' ? '승인됨' : '심사중'}
                </Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>재배 면적</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>{f.area.toLocaleString()} ㎡</div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>재배 작물</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>{f.cropNames.length} 종</div>
                </div>
              </div>
            </div>
          ))}

          {/* 새로운 농장 등록 카드 */}
          <Link href="/farm/register" style={{ textDecoration: 'none' }}>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-light)', height: '100%', cursor: 'pointer', transition: 'all 0.2s', minHeight: '200px' }}
                 onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16,185,129,0.02)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>＋</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>새로운 농장 등록하기</div>
              <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>또 다른 농장이 있으신가요?</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // 단일 농장 뷰
  return (
    <div className={styles.container}>
      {/* 페이지 헤더 */}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>홈</Link> / 
            {farms.length > 1 ? (
              <span style={{ cursor: 'pointer', color: 'var(--color-text-light)' }} onClick={() => setIsListView(true)}> 내 농장</span>
            ) : (
              <span style={{ color: 'var(--color-text-light)' }}> 내 농장</span>
            )} / {activeSubTab === 'DASHBOARD' ? '관리' : '정보'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {farms.length > 1 && (
              <button 
                onClick={() => setIsListView(true)} 
                style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="목록으로 돌아가기"
              >
                ←
              </button>
            )}
            <h1 className={styles.title}>{activeSubTab === 'DASHBOARD' ? '내 농장 관리' : farm?.name}</h1>
          </div>
          <p className={styles.subtitle}>
            {activeSubTab === 'DASHBOARD' 
              ? `${farm?.name}의 현황을 한눈에 확인하세요.` 
              : '농장 정보 및 재배 히스토리를 확인하고 기록하세요.'}
          </p>
        </div>
        <div className={styles.headerButtons}>
          {activeSubTab === 'DASHBOARD' ? (
            <>
              <Link href="/farm/cultivation-register">
                <Button variant="outline">+ 재배 등록</Button>
              </Link>
              <Link href="/farm/harvest">
                <Button variant="primary" style={{ background: '#ccff33', color: '#1a1a1a', border: 'none', fontWeight: 700 }}>🌾 수확 등록</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsHistoryModalOpen(true)}>이력 기록하기</Button>
              <Link href="/farm/register">
                <Button variant="primary" style={{ background: '#ccff33', color: '#1a1a1a', border: 'none', fontWeight: 700 }}>+ 새 농장 등록</Button>
              </Link>
            </>
          )}
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

      {/* Main Tabs (Navigation) */}
      <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0', marginBottom: '32px', display: 'flex', gap: '32px' }}>
        <button 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'DASHBOARD' ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: activeSubTab === 'DASHBOARD' ? 700 : 600, borderBottom: activeSubTab === 'DASHBOARD' ? '2px solid var(--color-primary)' : 'none', paddingBottom: '16px', marginBottom: '-1px', cursor: 'pointer', fontSize: '16px' }}
          onClick={() => setActiveSubTab('DASHBOARD')}
        >
          대시보드
        </button>
        <Link href="/balance" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          수급 분석
        </Link>
        <Link href="/recommend" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          AI 작물 추천
        </Link>
        <button 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'HISTORY' ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: activeSubTab === 'HISTORY' ? 700 : 600, borderBottom: activeSubTab === 'HISTORY' ? '2px solid var(--color-primary)' : 'none', paddingBottom: '16px', marginBottom: '-1px', cursor: 'pointer', fontSize: '16px' }}
          onClick={() => setActiveSubTab('HISTORY')}
        >
          농장 정보
        </button>
      </div>

      {activeSubTab === 'DASHBOARD' && (
        <>
          {/* KPI 카드 Row (Dashboard 전용) */}
          <div className={styles.kpiRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>재배 면적</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>{farm?.area.toLocaleString()}㎡</p>
            </div>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>재배 작물</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>{farm?.cropNames.length}종</p>
            </div>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>이번 달 수익</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>₩0M</p>
            </div>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>AI 점수</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>-</p>
            </div>
          </div>

          {/* 벤토 레이아웃 (Dashboard 전용) */}
          <div className={styles.grid2} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>최근 활동</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSubTab('HISTORY')}>전체보기 →</Button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--color-text-light)' }}>날짜</th>
                    <th style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--color-text-light)' }}>활동</th>
                    <th style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--color-text-light)' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.slice(0, 5).map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{h.activityContent}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge variant={h.activityType === 'USER' ? 'green' : 'lime'}>
                          {h.activityType === 'USER' ? '완료' : '시스템'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {histories.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>최근 활동 기록이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            <Card variant="dark">
              <h3 style={{ color: 'var(--color-accent)', marginBottom: '20px', fontSize: '18px' }}>농장 정보</h3>
              <dl style={{ fontSize: '14px', lineHeight: '2.2' }}>
                <dt style={{ opacity: 0.5 }}>위치</dt><dd>{farm?.address}</dd>
                <dt style={{ opacity: 0.5, marginTop: '12px' }}>면적</dt><dd>{farm?.area.toLocaleString()} ㎡</dd>
                <dt style={{ opacity: 0.5, marginTop: '12px' }}>주요 작물</dt><dd>{farm?.cropNames.join(', ')}</dd>
                <dt style={{ opacity: 0.5, marginTop: '12px' }}>등록 상태</dt>
                <dd>
                  <Badge variant={farm?.certificationStatus === 'APPROVED' ? 'green' : 'orange'}>
                    {farm?.certificationStatus === 'APPROVED' ? '인증됨' : '심사중'}
                  </Badge>
                </dd>
              </dl>
              <Link href={`/farm/${farm?.id}/edit`} style={{ display: 'block', marginTop: '24px' }}>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>정보 수정</Button>
              </Link>
            </Card>
          </div>
        </>
      )}

      {activeSubTab === 'HISTORY' && (
        <>
          {/* ☀️ Today's Weather & Insight Card (History 전용) */}
          <div className={styles.weatherCard} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1.5px solid var(--color-primary)', padding: '24px', display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ textAlign: 'center', paddingRight: '32px', borderRight: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>오늘의 양평 날씨</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '40px' }}>☀️</span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)' }}>22° <span style={{ fontSize: '16px', color: 'var(--color-text-light)', fontWeight: 400 }}>/ 11°</span></span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: 'var(--color-accent)', color: '#1a1a1a', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>AI SMART INSIGHT</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600 }}>"{farm?.cropNames.length ? farm.cropNames[0] : '작물'} 생육 최적기입니다"</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                기온 상승과 최근 관수 기록을 분석할 때 작물의 생육이 매우 활발합니다. 
                <strong>내일 오전 추가 시비</strong>를 권장하며, 기온이 높으니 <strong>병해충 방제</strong>에 유의하세요.
              </p>
            </div>
          </div>

          <div className={styles.grid2} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
            <div>
              {/* Sub Navigation (History 전용) */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '32px', display: 'flex', gap: '32px' }}>
                {(['POLICY', 'HISTORY'] as const).map((tab) => (
                  <button
                    key={tab}
                    style={{ background: 'none', border: 'none', color: (activeSubTab as string) === tab ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: (activeSubTab as string) === tab ? 700 : 600, borderBottom: (activeSubTab as string) === tab ? '2px solid var(--color-primary)' : 'none', paddingBottom: '16px', marginBottom: '-17px', cursor: 'pointer', fontSize: '16px' }}
                    onClick={() => setActiveSubTab(tab)}
                  >
                    {tab === 'POLICY' ? '정책/혜택 안내' : '재배 히스토리'}
                  </button>
                ))}
              </div>



              <Timeline 
                histories={histories} 
                onEdit={handleEditClick}
                onDelete={removeHistory}
              />
            </div>

            {/* 농장 정보 사이드 카드 */}
            <div>
              <Card variant="dark">
                <h3 className={styles.farmInfoTitle} style={{ fontSize: '18px', marginBottom: '16px' }}>농장 정보</h3>
                <dl className={styles.farmInfoList}>
                   <dt>위치</dt><dd>{farm?.address}</dd>
                   <dt>면적</dt><dd>{farm?.area.toLocaleString()} ㎡</dd>
                   <dt>주요 작물</dt><dd>{farm?.cropNames.join(', ')}</dd>
                   <dt>상태</dt>
                   <dd>
                     <Badge variant={farm?.certificationStatus === 'APPROVED' ? 'green' : 'orange'}>
                       {farm?.certificationStatus === 'APPROVED' ? '인증됨' : '심사중'}
                     </Badge>
                   </dd>
                </dl>
                <Link href={`/farm/${farm?.id}/edit`} style={{ display: 'block', marginTop: '24px' }}>
                  <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>정보 수정</Button>
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


