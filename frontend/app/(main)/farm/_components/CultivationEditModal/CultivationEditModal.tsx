import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal/Modal';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import { CultivationRegistration } from '../../_lib/cultivation.api';

interface CultivationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cropId: number, area: number, yieldAmount: number, unit: string) => Promise<boolean>;
  cultivation: CultivationRegistration | null;
  cropOptions: { id: number, name: string }[];
}

export default function CultivationEditModal({ isOpen, onClose, onSave, cultivation, cropOptions }: CultivationEditModalProps) {
  const [cropId, setCropId] = useState<number>(0);
  const [area, setArea] = useState('');
  const [pyeong, setPyeong] = useState('');
  const [yieldAmount, setYieldAmount] = useState('');
  const [unit, setUnit] = useState('kg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cultivation) {
      setCropId(cultivation.cropId);
      setArea(String(cultivation.cultivationArea || ''));
      setPyeong(cultivation.cultivationArea ? (cultivation.cultivationArea / 3.3058).toFixed(1) : '');
      setYieldAmount(String(cultivation.farmerEstimatedYield || ''));
      setUnit(cultivation.yieldUnit || 'kg');
    }
  }, [cultivation]);

  // 선택된 작물명 찾기
  const selectedCropName = cropOptions.find(c => c.id === cropId)?.name || cultivation?.cropName || '';

  // 작물별 평균 생산량 가이드 로직
  const getAverageYieldPerSqm = (cropName: string) => {
    if (!cropName) return 2.0;
    if (cropName.includes('감자')) return 3.5;
    if (cropName.includes('양파')) return 5.0;
    if (cropName.includes('벼') || cropName.includes('쌀')) return 0.5;
    if (cropName.includes('고구마')) return 2.8;
    if (cropName.includes('배추')) return 2.0;
    return 2.0;
  };

  const avgYieldRate = getAverageYieldPerSqm(selectedCropName);
  const recommendedYield = area && !isNaN(Number(area)) ? (Number(area) * avgYieldRate).toFixed(0) : null;

  const handleAreaChange = (val: string) => {
    setArea(val);
    if (val && !isNaN(Number(val))) {
      setPyeong((Number(val) / 3.3058).toFixed(1));
    } else {
      setPyeong('');
    }
  };

  const handlePyeongChange = (val: string) => {
    setPyeong(val);
    if (val && !isNaN(Number(val))) {
      setArea((Number(val) * 3.3058).toFixed(1));
    } else {
      setArea('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onSave(cropId, Number(area), Number(yieldAmount), unit);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${selectedCropName} 정보 수정`}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
            재배 작물
          </label>
          <Dropdown
            options={cropOptions.map(c => ({ value: String(c.id), label: c.name }))}
            value={String(cropId)}
            onChange={(val) => setCropId(Number(val))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <Input
            label="재배 면적 (평)"
            type="number"
            value={pyeong}
            onChange={e => handlePyeongChange(e.target.value)}
          />
          <Input
            label="재배 면적 (㎡)"
            type="number"
            value={area}
            onChange={e => handleAreaChange(e.target.value)}
            required
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
            예상 생산량
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Input
              type="number"
              value={yieldAmount}
              onChange={e => setYieldAmount(e.target.value)}
              required
            />
            <Dropdown
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'g', label: 'g' },
                { value: 'ton', label: 'ton' },
              ]}
              value={unit}
              onChange={setUnit}
            />
          </div>
          
          {cultivation && (
            <div style={{ 
              backgroundColor: '#F0FDF4', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              color: '#166534',
              lineHeight: '1.5'
            }}>
              💡 <strong>가이드:</strong> 평균적으로 {selectedCropName}은(는) 1㎡당 약 {avgYieldRate}kg 생산됩니다.
              {recommendedYield && (
                <> 면적을 입력하시면 지역 평균 예상 수확량인 <strong>{recommendedYield}kg</strong>을 추천해 드립니다.</>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>저장하기</Button>
        </div>
      </form>
    </Modal>
  );
}
