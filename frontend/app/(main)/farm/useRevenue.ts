import { useState, useCallback, useRef } from 'react';
import { predictRevenue, RevenuePredictionRequest, RevenuePredictionResponse } from './_lib/revenue.api';
import { useToast } from '@/components/common/Toast';

export function useRevenue() {
  const [prediction, setPrediction] = useState<RevenuePredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const originalPredictionRef = useRef<RevenuePredictionResponse | null>(null);
  const toast = useToast();

  const getPrediction = useCallback(async (request: RevenuePredictionRequest) => {
    setIsLoading(true);
    try {
      const result = await predictRevenue(request);
      setPrediction(result);
      if (request.actual_yield_kg == null) {
        originalPredictionRef.current = result;
      }
      return result;
    } catch (err: any) {
      toast.error(err.message || 'AI 수익 예측에 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const revertPrediction = useCallback(() => {
    if (originalPredictionRef.current) {
      setPrediction(originalPredictionRef.current);
    }
  }, []);

  return { prediction, isLoading, getPrediction, revertPrediction };
}
