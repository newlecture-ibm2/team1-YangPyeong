import { useState, useEffect, useCallback } from 'react';
import { getCultivations, updateCultivation, deleteCultivation, CultivationRegistration } from './_lib/cultivation.api';
import { useToast } from '@/components/common/Toast';

export function useCultivation(farmId?: number) {
  const [cultivations, setCultivations] = useState<CultivationRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const fetchCultivations = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    try {
      const data = await getCultivations(farmId);
      setCultivations(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  const modifyCultivation = async (cultivationId: number, area: number, yieldAmount: number, unit: string) => {
    if (!farmId) return false;
    try {
      await updateCultivation(farmId, cultivationId, {
        area: area,
        yield: yieldAmount,
        unit: unit
      });
      toast.success('재배 정보가 수정되었습니다.');
      await fetchCultivations();
      return true;
    } catch (err: any) {
      toast.error(err.message || '수정에 실패했습니다.');
      return false;
    }
  };

  const removeCultivation = async (cultivationId: number) => {
    if (!farmId) return false;
    if (!confirm('정말 삭제하시겠습니까?')) return false;
    try {
      await deleteCultivation(farmId, cultivationId);
      toast.success('재배 정보가 삭제되었습니다.');
      await fetchCultivations();
      return true;
    } catch (err: any) {
      toast.error(err.message || '삭제에 실패했습니다.');
      return false;
    }
  };

  useEffect(() => {
    fetchCultivations();
  }, [fetchCultivations]);

  return { cultivations, isLoading, modifyCultivation, removeCultivation, refresh: fetchCultivations };
}
