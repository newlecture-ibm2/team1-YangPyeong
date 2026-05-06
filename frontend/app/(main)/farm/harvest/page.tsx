'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import { useToast } from '@/components/common/Toast';
import { useMyFarms } from '../_hooks/useFarm';
import { getCultivations, type CultivationRegistration } from '../_lib/cultivation.api';
import { recordHarvest } from '../_lib/harvest.api';
import styles from './page.module.css';

export default function HarvestRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { farms, isLoading: isFarmsLoading } = useMyFarms();

  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [cultivations, setCultivations] = useState<CultivationRegistration[]>([]);
  const [isCultivationsLoading, setIsCultivationsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    cultivationRegistrationId: '',
    harvestDate: new Date().toISOString().split('T')[0],
    grade: '특',
    yieldAmount: '',
    yieldUnit: 'kg',
    toShop: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 농장이 1개면 자동 선택
  useEffect(() => {
    if (farms.length === 1) {
      setSelectedFarmId(String(farms[0].id));
    }
  }, [farms]);

  // 선택된 농장의 재배 목록 가져오기
  useEffect(() => {
    if (!selectedFarmId) {
      setCultivations([]);
      return;
    }

    setIsCultivationsLoading(true);
    getCultivations(Number(selectedFarmId))
      .then(setCultivations)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsCultivationsLoading(false));
  }, [selectedFarmId, toast]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cultivationRegistrationId) {
      toast.error('수확 대상 작물을 선택해주세요.');
      return;
    }
    if (!formData.yieldAmount || Number(formData.yieldAmount) <= 0) {
      toast.error('수확량을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordHarvest({
        cultivationRegistrationId: Number(formData.cultivationRegistrationId),
        harvestDate: formData.harvestDate,
        yieldAmount: Number(formData.yieldAmount),
        yieldUnit: formData.yieldUnit,
        grade: formData.grade,
        toShop: formData.toShop
      });

      toast.success('수확 등록이 완료되었습니다!');
      
      // 상점 판매 선택 시 상점 등록 페이지로 이동 (향후 구현 예정)
      if (formData.toShop) {
        toast.info('상점 상품 등록 페이지로 이동합니다.');
        // router.push('/shop/register'); // 임시 주석
        router.push('/farm');
      } else {
        router.push('/farm');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '수확 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFarmsLoading) {
    return (
      <div className={styles.container}>
        <p style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>수확 등록</h1>
          <p className={styles.subtitle}>먼저 농장을 등록해야 수확 등록이 가능합니다.</p>
        </div>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Link href="/farm/register">
            <Button variant="primary">농장 등록하기 →</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>홈</Link> › 
          <Link href="/farm" className={styles.breadcrumbLink}> 농장관리</Link> › 
          <strong> 수확 등록</strong>
        </p>
        <h1 className={styles.title}>🌾 수확 등록</h1>
        <p className={styles.subtitle}>수확한 작물의 정보를 기록하고, 상점 판매(상품화) 여부를 결정합니다.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: '24px' }}>
          {farms.length > 1 && (
            <div style={{ marginBottom: '20px' }}>
              <Dropdown
                label="농장 선택"
                options={farms.map(f => ({ value: String(f.id), label: `${f.name} (${f.address})` }))}
                placeholder="수확 등록할 농장을 선택하세요"
                value={selectedFarmId}
                onChange={setSelectedFarmId}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <Dropdown
              label="수확 대상 작물 (재배 등록 건) *"
              options={cultivations.map(c => ({ 
                value: String(c.id), 
                label: `${c.cropName} (재배면적 ${c.cultivationArea?.toLocaleString()}㎡)` 
              }))}
              placeholder={isCultivationsLoading ? '로딩 중...' : '재배 등록된 작물을 선택하세요'}
              value={formData.cultivationRegistrationId}
              onChange={val => handleChange('cultivationRegistrationId', val)}
              disabled={isCultivationsLoading || cultivations.length === 0}
            />
            {selectedFarmId && !isCultivationsLoading && cultivations.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginTop: '8px' }}>
                해당 농장에 등록된 재배 정보가 없습니다. 먼저 [재배 등록]을 진행해 주세요.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <Input
              label="실제 수확일 *"
              type="date"
              value={formData.harvestDate}
              onChange={e => handleChange('harvestDate', e.target.value)}
              required
            />
            <Dropdown
              label="품질 등급"
              options={[
                { value: '특', label: '특' },
                { value: '상', label: '상' },
                { value: '보통', label: '보통' },
                { value: '등외', label: '등외' },
              ]}
              value={formData.grade}
              onChange={val => handleChange('grade', val)}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              실제 수확량 *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                type="number"
                placeholder="예) 850"
                required
                value={formData.yieldAmount}
                onChange={e => handleChange('yieldAmount', e.target.value)}
              />
              <Dropdown
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'ton', label: 'ton' },
                ]}
                value={formData.yieldUnit}
                onChange={val => handleChange('yieldUnit', val)}
                style={{ width: '100px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>
              상점 판매(상품화) 여부 *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
                <input 
                  type="radio" 
                  name="toShop" 
                  checked={formData.toShop === true} 
                  onChange={() => handleChange('toShop', true)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                /> 
                예, 바로 상품으로 등록합니다.
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
                <input 
                  type="radio" 
                  name="toShop" 
                  checked={formData.toShop === false} 
                  onChange={() => handleChange('toShop', false)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                /> 
                아니오, 자가 소비 또는 오프라인 판매용입니다.
              </label>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-light)', marginTop: '10px' }}>
              * '예'를 선택하시면 수확 등록 후 상품 정보 입력 페이지로 이동합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '40px' }}>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !formData.cultivationRegistrationId}>
              {isSubmitting ? '등록 중...' : '수확 등록 완료'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
