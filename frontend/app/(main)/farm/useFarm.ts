/* ════════════════════════════════════════════════════════
   Farm 도메인 데이터 관리를 위한 커스텀 훅
   ════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { getMyFarms, getFarmDetail, deleteFarm } from './_lib/farm.api';
import { FarmListItem, FarmDetail } from './_lib/farm.types';
import { useToast } from '@/components/common/Toast';

/**
 * 내 농장 목록을 관리하는 훅
 */
export function useMyFarms() {
  const [farms, setFarms] = useState<FarmListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchFarms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyFarms();
      // 생성된 순서(ID 오름차순)로 정렬하여 UI 위치가 바뀌지 않도록 보장
      const sortedData = [...data].sort((a, b) => a.id - b.id);
      setFarms(sortedData);
    } catch (err: any) {
      toast.error(err.message || '농장 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  const removeFarm = async (id: number) => {
    try {
      await deleteFarm(id);
      toast.success('농장이 삭제되었습니다.');
      await fetchFarms();
      return true;
    } catch (err: any) {
      toast.error(err.message || '농장 삭제에 실패했습니다.');
      return false;
    }
  };

  return { farms, isLoading, refetch: fetchFarms, removeFarm };
}

/**
 * 특정 농장 상세 정보를 관리하는 훅
 */
export function useFarmDetail(id: number) {
  const [farm, setFarm] = useState<FarmDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getFarmDetail(id);
      setFarm(data);
    } catch (err: any) {
      toast.error(err.message || '농장 상세 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const removeFarm = async () => {
    if (!id) return;
    try {
      await deleteFarm(id);
      toast.success('농장이 삭제되었습니다.');
      return true;
    } catch (err: any) {
      toast.error(err.message || '농장 삭제에 실패했습니다.');
      return false;
    }
  };

  return { farm, isLoading, refetch: fetchDetail, removeFarm };
}
