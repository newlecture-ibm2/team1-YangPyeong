package com.farmbalance.farm.application.port.out;

/**
 * AI 서버를 통한 수확량 예측 포트 (Output Port)
 */
public interface PredictYieldPort {
    Double predictYield(Long cropId, Double area, String cultivationType);
}
