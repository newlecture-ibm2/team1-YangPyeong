'use client';

import Link from 'next/link';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import { useSeedForm } from './useSeedForm';
import { useMyFarms } from '../_hooks/useFarm';
import styles from './page.module.css';

/**
 * 종자 및 파종 계획 등록 페이지 (FRM-002, FRM-003 통합)
 */
export default function SeedRegistrationPage() {
  const { formData, isLoading, handleChange, handleSubmit } = useSeedForm();
  const { farms } = useMyFarms();

  // 농장 선택 옵션
  const farmOptions = farms.map(f => ({
    label: f.name,
    value: String(f.id)
  }));

  // 임시 작물 옵션 (추후 API 연동)
  const cropOptions = [
    { label: '양평 개군 한우용 옥수수', value: '1' },
    { label: '유기농 상추', value: '2' },
    { label: '양평 백운 토마토', value: '3' },
    { label: '지평 쌀 (고시히카리)', value: '4' },
    { label: '부추', value: '5' }
  ];

  const typeOptions = [
    { label: '씨앗 (Seed)', value: 'SEED' },
    { label: '종자/구근 (Seedling)', value: 'SEEDLING' },
    { label: '모종 (Sapling)', value: 'SAPLING' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>재배 계획 <span className={styles.italic}>등록</span></h1>
        <p className={styles.subtitle}>어떤 작물을 어디에 심으실 계획인가요? 등록 시 AI가 예상 수익을 분석해 드립니다.</p>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Card>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>1. 농장 및 작물 선택</h3>
              <div className={styles.row}>
                <Dropdown
                  label="대상 농장"
                  options={farmOptions}
                  value={formData.farmId}
                  onChange={(val) => handleChange('farmId', val)}
                  placeholder="농장을 선택하세요"
                  required
                />
                <Dropdown
                  label="재배 작물"
                  options={cropOptions}
                  value={formData.cropId}
                  onChange={(val) => handleChange('cropId', val)}
                  placeholder="작물을 선택하세요"
                  required
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>2. 재배 상세 정보</h3>
              <div className={styles.row}>
                <Dropdown
                  label="재배 유형"
                  options={typeOptions}
                  value={formData.cultivationType}
                  onChange={(val) => handleChange('cultivationType', val)}
                  required
                />
                <Input
                  label="재배 면적 (㎡)"
                  type="number"
                  placeholder="예: 330"
                  value={formData.cultivationArea}
                  onChange={(e) => handleChange('cultivationArea', e.target.value)}
                  required
                />
              </div>
              <div className={styles.row}>
                <Input
                  label="목표 수확량 (선택)"
                  type="number"
                  placeholder="예: 500"
                  value={formData.farmerEstimatedYield}
                  onChange={(e) => handleChange('farmerEstimatedYield', e.target.value)}
                />
                <Dropdown
                  label="단위"
                  options={[
                    { label: 'kg', value: 'kg' },
                    { label: 'ton', value: 'ton' },
                    { label: 'g', value: 'g' }
                  ]}
                  value={formData.yieldUnit}
                  onChange={(val) => handleChange('yieldUnit', val)}
                />
              </div>
            </div>

            <div className={styles.infoBox}>
              <p className="text-sm">
                💡 <strong>TIP</strong>: 파종 계획을 등록하면 지자체에서 제공하는 
                <span className="text-primary font-bold"> 맞춤형 농업 보조금 정책</span>을 즉시 확인할 수 있습니다.
              </p>
            </div>

            <div className={styles.actions}>
              <Link href="/farm">
                <Button variant="outline" type="button">취소</Button>
              </Link>
              <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? '등록 중...' : '재배 계획 등록하기'}
              </Button>
            </div>
          </Card>
        </form>

        <div className={styles.sideInfo}>
          <Card variant="dark">
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '16px' }}>AI 실시간 가이드</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>
              작물을 선택하고 면적을 입력하시면, 양평군 내 수급 현황과 토양 상태를 분석하여 
              <strong> 최적의 파종 시기</strong>와 <strong>예상 수익</strong>을 계산해 드립니다.
            </p>
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>양평군 부추 수급 상태</p>
              <p style={{ fontSize: '18px', fontWeight: 700 }}>🟢 적정 (Balanced)</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
