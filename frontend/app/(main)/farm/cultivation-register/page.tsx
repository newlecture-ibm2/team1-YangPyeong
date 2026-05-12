'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import { useToast } from '@/components/common/Toast';
import { useMyFarms } from '../useFarm';
import { registerCultivation } from '../_lib/cultivation.api';
import styles from './page.module.css';

interface CropOption {
  id: number;
  name: string;
  categoryId: number;
}

interface CropCategory {
  id: number;
  name: string;
}

interface CultivationEntry {
  cropId: number;
  cropName: string;
  area: string;
  pyeong: string;
  expectedYield: string;
  yieldUnit: string;
}

export default function CultivationRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { farms, isLoading: isFarmsLoading } = useMyFarms();

  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [cropCategories, setCropCategories] = useState<CropCategory[]>([]);
  const [cropOptions, setCropOptions] = useState<CropOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cultivations, setCultivations] = useState<CultivationEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 작물 분류 목록 가져오기
  useEffect(() => {
    fetch('/api/admin/crops/categories')
      .then(res => res.json())
      .then(json => { if (json.success) setCropCategories(json.data || []); })
      .catch(() => {});

    // [추가] 쿼리 파라미터로 넘어온 작물이 있다면 자동으로 추가
    const cropId = searchParams.get('cropId');
    const cropName = searchParams.get('cropName');

    if (cropId && cropName) {
      setCultivations([{
        cropId: Number(cropId),
        cropName: cropName,
        area: '',
        pyeong: '',
        expectedYield: '',
        yieldUnit: 'kg',
      }]);
    }
  }, [searchParams]);

  // 작물 목록 가져오기
  useEffect(() => {
    const url = selectedCategory
      ? `/api/admin/crops?categoryId=${selectedCategory}`
      : '/api/admin/crops';
    fetch(url)
      .then(res => res.json())
      .then(json => { if (json.success) setCropOptions(json.data || []); })
      .catch(() => {});
  }, [selectedCategory]);

  // 농장이 1개면 자동 선택
  useEffect(() => {
    if (farms.length === 1) {
      setSelectedFarmId(String(farms[0].id));
    }
  }, [farms]);

  // 임시 가이드: 작물별 대략적인 1㎡당 평균 생산량(kg)
  const getAverageYieldPerSqm = (cropName: string) => {
    if (cropName.includes('감자')) return 3.5;
    if (cropName.includes('양파')) return 5.0;
    if (cropName.includes('벼') || cropName.includes('쌀')) return 0.5;
    if (cropName.includes('고구마')) return 2.8;
    return 2.0;
  };

  const handleAddCrop = (cropIdStr: string) => {
    const cropId = Number(cropIdStr);
    if (!cropId) return;
    if (cultivations.find(c => c.cropId === cropId)) {
      toast.error('이미 추가된 작물입니다.');
      return;
    }
    const crop = cropOptions.find(c => c.id === cropId);
    setCultivations(prev => [
      ...prev,
      {
        cropId,
        cropName: crop?.name || `작물 ${cropId}`,
        area: '',
        pyeong: '',
        expectedYield: '',
        yieldUnit: 'kg',
      },
    ]);
  };

  const removeCrop = (cropId: number) => {
    setCultivations(prev => prev.filter(c => c.cropId !== cropId));
  };

  const handleChange = (cropId: number, field: string, value: string) => {
    setCultivations(prev =>
      prev.map(c => {
        if (c.cropId !== cropId) return c;

        if (field === 'area') {
          const pyeongValue = value && !isNaN(Number(value)) ? (Number(value) / 3.3058).toFixed(1) : '';
          return { ...c, area: value, pyeong: pyeongValue };
        }
        if (field === 'pyeong') {
          const m2Value = value && !isNaN(Number(value)) ? (Number(value) * 3.3058).toFixed(1) : '';
          return { ...c, pyeong: value, area: m2Value };
        }
        return { ...c, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFarmId) {
      toast.error('농장을 선택해주세요.');
      return;
    }
    if (cultivations.length === 0) {
      toast.error('재배할 작물을 1개 이상 추가해주세요.');
      return;
    }

    // 모든 작물에 면적 입력 확인
    for (const c of cultivations) {
      if (!c.area || Number(c.area) <= 0) {
        toast.error(`${c.cropName}의 재배 면적을 입력해주세요.`);
        return;
      }
    }

    const selectedFarm = farms.find(f => String(f.id) === selectedFarmId);
    if (selectedFarm) {
      const totalCultivationArea = cultivations.reduce((sum, c) => sum + (Number(c.area) || 0), 0);
      if (totalCultivationArea > selectedFarm.area) {
        toast.error(`입력한 작물 면적 합계(${totalCultivationArea}㎡)가 농장 전체 면적(${selectedFarm.area}㎡)을 초과할 수 없습니다.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      for (const c of cultivations) {
        await registerCultivation(Number(selectedFarmId), {
          cropId: c.cropId,
          cultivationArea: Number(c.area),
          expectedYield: Number(c.expectedYield) || 0,
          yieldUnit: c.yieldUnit,
        });
      }
      toast.success('재배 등록이 완료되었습니다!');
      router.push('/farm');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '재배 등록에 실패했습니다.');
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
          <h1 className={styles.title}>재배 등록</h1>
          <p className={styles.subtitle}>먼저 농장을 등록해야 재배 등록이 가능합니다.</p>
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
          <Link href="/farm" className={styles.breadcrumbLink}>홈</Link> ›
          <Link href="/farm" className={styles.breadcrumbLink}> 농장관리</Link> ›
          <strong> 재배 등록</strong>
        </p>
        <h1 className={styles.title}>재배 <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>등록</span></h1>
        <p className={styles.subtitle}>재배할 작물과 면적을 등록하여 수급 데이터 예측을 시작합니다.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 농장 선택 */}
        {farms.length > 1 && (
          <Card className={styles.cardSection}>
            <Dropdown
              label="농장 선택"
              options={farms.map(f => ({ value: String(f.id), label: `${f.name} (${f.address})` }))}
              placeholder="재배 등록할 농장을 선택하세요"
              value={selectedFarmId}
              onChange={setSelectedFarmId}
            />
          </Card>
        )}

        {/* 작물 추가 영역 */}
        <Card className={styles.cardSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
              등록 대기 중인 작물 <strong style={{ color: 'var(--color-primary)' }}>{cultivations.length}</strong>건
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <Dropdown
              label="작물 분류"
              options={[
                { value: '', label: '전체' },
                ...cropCategories.map(c => ({ value: String(c.id), label: c.name })),
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="선택하세요"
            />
            <Dropdown
              label="작물명"
              options={cropOptions.map(c => ({ value: String(c.id), label: c.name }))}
              placeholder={cropOptions.length > 0 ? '작물을 선택하세요' : '작물 분류를 먼저 선택하세요'}
              value=""
              onChange={handleAddCrop}
            />
          </div>
        </Card>

        {/* 등록된 작물 카드들 */}
        {cultivations.map((cult, idx) => {
          const avgPerSqm = getAverageYieldPerSqm(cult.cropName);
          const expectedAvg = cult.area && !isNaN(Number(cult.area))
            ? (Number(cult.area) * avgPerSqm).toLocaleString()
            : '0';

          return (
            <Card key={cult.cropId} className={styles.cardSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--color-primary-pale, rgba(16,185,129,0.1))', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>{idx + 1}</span>
                  <strong>🌱 {cult.cropName}</strong>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => removeCrop(cult.cropId)}>✕</Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="재배 면적 (평)"
                  type="number"
                  placeholder="예) 300"
                  value={cult.pyeong}
                  onChange={e => handleChange(cult.cropId, 'pyeong', e.target.value)}
                />
                <Input
                  label="재배 면적 (㎡) *"
                  type="number"
                  placeholder="예) 1000"
                  required
                  value={cult.area}
                  onChange={e => handleChange(cult.cropId, 'area', e.target.value)}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '-12px', marginBottom: '8px' }}>
                💡 평 또는 ㎡ 중 하나만 입력하면 자동으로 환산됩니다.
              </p>

              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  농가 예상 총 생산량 *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    type="number"
                    placeholder="예) 500"
                    required
                    value={cult.expectedYield}
                    onChange={e => handleChange(cult.cropId, 'expectedYield', e.target.value)}
                  />
                  <Dropdown
                    options={[
                      { value: 'kg', label: 'kg' },
                      { value: 'g', label: 'g' },
                      { value: 'ton', label: 'ton' },
                    ]}
                    value={cult.yieldUnit}
                    onChange={val => handleChange(cult.cropId, 'yieldUnit', val)}
                  />
                </div>
              </div>

              {/* 가이드 */}
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-secondary)', background: 'rgba(45,106,79,0.05)', padding: '10px', borderRadius: '6px', display: 'flex', gap: '6px' }}>
                <span>💡</span>
                <div>
                  <strong>가이드:</strong> 평균적으로 <strong>{cult.cropName}</strong>은(는) 1㎡당 약 {avgPerSqm}kg 생산됩니다.
                  {cult.area ? (
                    <span style={{ color: 'var(--color-primary)' }}>
                      {' '}입력하신 면적({cult.area}㎡) 기준, 대략 <strong>{expectedAvg}kg</strong> 수확을 예상해 볼 수 있습니다.
                    </span>
                  ) : (
                    <span> 면적을 입력하시면 지역 평균 예상 수확량을 계산해 드립니다.</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* 하단 버튼 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || cultivations.length === 0}>
            {isSubmitting ? '등록 중...' : '등록하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
