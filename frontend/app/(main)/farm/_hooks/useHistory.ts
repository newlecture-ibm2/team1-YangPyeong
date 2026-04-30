import { useState, useEffect, useCallback } from 'react';
import { getFarmHistories, recordFarmHistory, updateFarmHistory, deleteFarmHistory, CultivationHistory } from '../_lib/history.api';
import { useToast } from '@/components/common/Toast';

export function useHistory(farmId?: number) {
  const [histories, setHistories] = useState<CultivationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const fetchHistories = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    try {
      const data = await getFarmHistories(farmId);
      setHistories(data);
    } catch (err: any) {
      console.error(err);
      // toast.error('이력을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  const addHistory = async (content: string): Promise<boolean> => {
    if (!farmId) return false;
    try {
      await recordFarmHistory(farmId, content);
      toast.success('이력이 기록되었습니다.');
      await fetchHistories(); // 갱신
      return true;
    } catch (err: any) {
      toast.error(err.message || '기록에 실패했습니다.');
      return false;
    }
  };

  const updateHistory = async (historyId: number, content: string): Promise<boolean> => {
    if (!farmId) return false;
    try {
      await updateFarmHistory(farmId, historyId, content);
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
    if (!confirm('정말 삭제하시겠습니까?')) return false;
    
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
    fetchHistories();
  }, [fetchHistories]);

  return { histories, isLoading, addHistory, updateHistory, removeHistory, refresh: fetchHistories };
}

