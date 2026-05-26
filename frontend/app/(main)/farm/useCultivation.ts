import { useState, useEffect, useCallback, useRef } from 'react';
import { getCultivations, updateCultivation, deleteCultivation, CultivationRegistration } from './_lib/cultivation.api';
import { useToast } from '@/components/common/Toast';

export function useCultivation(farmId?: number, skipInitialFetch = false) {
  const [cultivations, setCultivations] = useState<CultivationRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const farmIdRef = useRef(farmId);
  useEffect(() => {
    farmIdRef.current = farmId;
  }, [farmId]);

  const fetchCultivations = useCallback(async () => {
    if (!farmId) return;
    const targetFarmId = farmId;
    setIsLoading(true);
    try {
      const data = await getCultivations(farmId);
      if (farmIdRef.current !== targetFarmId) return;
      // 백엔드는 ACTIVE만 반환하지만, 클라이언트 캐시·레이스 대비 이중 필터
      setCultivations(data.filter((c) => !c.status || c.status === 'ACTIVE'));
    } catch (err: any) {
      if (farmIdRef.current === targetFarmId) {
        console.error(err);
      }
    } finally {
      if (farmIdRef.current === targetFarmId) {
        setIsLoading(false);
      }
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
    if (!farmId) {
      setCultivations([]);
      setIsLoading(false);
      return;
    }
    if (skipInitialFetch) return;
    fetchCultivations();
  }, [farmId, skipInitialFetch, fetchCultivations]);

  return { cultivations, isLoading, modifyCultivation, removeCultivation, refresh: fetchCultivations };
}
