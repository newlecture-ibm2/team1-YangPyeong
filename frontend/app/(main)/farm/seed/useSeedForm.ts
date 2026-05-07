'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/common/Toast';
import { registerCultivation } from '../_lib/cultivation.api';

/**
 * 종자/재배 등록 폼 로직 전용 Hook
 */
export function useSeedForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const farmIdFromQuery = searchParams.get('farmId');
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmId: farmIdFromQuery || '',
    cropId: '',
    cultivationType: 'SEED' as any,
    cultivationArea: '',
    farmerEstimatedYield: '',
    yieldUnit: 'kg',
  });

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.farmId) {
      toast.error('농장을 선택해 주세요.');
      return;
    }
    if (!formData.cropId) {
      toast.error('작물을 선택해 주세요.');
      return;
    }
    if (!formData.cultivationArea) {
      toast.error('재배 면적을 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await registerCultivation(Number(formData.farmId), {
        cropId: Number(formData.cropId),
        cultivationArea: Number(formData.cultivationArea),
        expectedYield: formData.farmerEstimatedYield ? Number(formData.farmerEstimatedYield) : 0,
        yieldUnit: formData.yieldUnit,
      });
      
      toast.success('재배 계획이 성공적으로 등록되었습니다!');
      router.push('/farm');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit,
  };
}
