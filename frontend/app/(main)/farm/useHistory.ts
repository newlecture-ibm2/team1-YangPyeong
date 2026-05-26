import { useState, useEffect, useCallback, useRef } from 'react';
import { getFarmHistories, recordFarmHistory, updateFarmHistory, deleteFarmHistory, CultivationHistory } from './_lib/history.api';
import { useToast } from '@/components/common/Toast';

export function useHistory(farmId?: number, skipInitialFetch = false) {
  const [histories, setHistories] = useState<CultivationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const farmIdRef = useRef(farmId);
  useEffect(() => {
    farmIdRef.current = farmId;
  }, [farmId]);

  const fetchHistories = useCallback(async () => {
    if (!farmId) return;
    const targetFarmId = farmId;
    setIsLoading(true);
    try {
      const data = await getFarmHistories(farmId);
      if (farmIdRef.current !== targetFarmId) return;
      
      // 중복되는 날씨 기록 필터링 (같은 날짜에 동일한 내용이면 하나만 표시)
      const filteredData = data.filter((h, index, self) => {
        if (h.activityType !== 'WEATHER') return true;
        const targetDateStr1 = h.recordDate || h.createdAt;
        const dateStr = new Date(targetDateStr1.includes('T') ? targetDateStr1 : `${targetDateStr1}T00:00:00`).toLocaleDateString();
        const firstIndex = self.findIndex(
          (item) => {
            const targetDateStr2 = item.recordDate || item.createdAt;
            return item.activityType === 'WEATHER' &&
            new Date(targetDateStr2.includes('T') ? targetDateStr2 : `${targetDateStr2}T00:00:00`).toLocaleDateString() === dateStr &&
            item.activityContent === h.activityContent
          }
        );
        return firstIndex === index;
      });

      setHistories(filteredData);
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

  const addHistory = async (content: string, recordDate?: string): Promise<boolean> => {
    if (!farmId) return false;
    try {
      await recordFarmHistory(farmId, content, recordDate);
      toast.success('이력이 기록되었습니다.');
      await fetchHistories(); // 갱신
      return true;
    } catch (err: any) {
      toast.error(err.message || '기록에 실패했습니다.');
      return false;
    }
  };

  const updateHistory = async (historyId: number, content: string, recordDate?: string): Promise<boolean> => {
    if (!farmId) return false;
    try {
      await updateFarmHistory(farmId, historyId, content, recordDate);
      toast.success('이력이 수정되었습니다.');
      await fetchHistories();
      return true;
    } catch (err: any) {
      toast.error(err.message || '수정에 실패했습니다.');
      return false;
    }
  };

  const removeHistory = async (historyId: number): Promise<boolean> => {
    if (!farmId) return false;
    
    try {
      await deleteFarmHistory(farmId, historyId);
      toast.success('이력이 삭제되었습니다.');
      await fetchHistories();
      return true;
    } catch (err: any) {
      toast.error(err.message || '삭제에 실패했습니다.');
      return false;
    }
  };

  useEffect(() => {
    if (!farmId) {
      setHistories([]);
      setIsLoading(false);
      return;
    }
    if (skipInitialFetch) return;
    fetchHistories();
  }, [farmId, skipInitialFetch, fetchHistories]);

  return { histories, isLoading, addHistory, updateHistory, removeHistory, refresh: fetchHistories };
}

