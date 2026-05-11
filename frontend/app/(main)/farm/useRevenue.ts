import { useState, useCallback } from 'react';
import { predictRevenue, RevenuePredictionRequest, RevenuePredictionResponse } from './_lib/revenue.api';
import { useToast } from '@/components/common/Toast';

export function useRevenue() {
  const [prediction, setPrediction] = useState<RevenuePredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const getPrediction = useCallback(async (request: RevenuePredictionRequest) => {
    setIsLoading(true);
    try {
      const result = await predictRevenue(request);
      setPrediction(result);
      return result;
    } catch (err: any) {
      toast.error(err.message || 'AI 수익 예측에 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { prediction, isLoading, getPrediction };
}
