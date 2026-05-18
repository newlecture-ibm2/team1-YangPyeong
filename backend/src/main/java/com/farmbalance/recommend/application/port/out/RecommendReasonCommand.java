package com.farmbalance.recommend.application.port.out;

import com.farmbalance.recommend.domain.AdviceType;
import com.farmbalance.recommend.domain.RecommendMode;

/**
 * AI 추천 사유 생성 요청
 */
public record RecommendReasonCommand(
        String farmDetails,
        String cropName,
        String cropCategory,
        RecommendMode recommendMode,
        AdviceType adviceType,
        boolean currentCrop,
        String mismatchNote
) {
}
