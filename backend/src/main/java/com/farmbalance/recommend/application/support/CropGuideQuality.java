package com.farmbalance.recommend.application.support;

import java.util.List;
import java.util.Map;

/**
 * AI 재배 가이드 응답 최소 품질 검증
 */
public final class CropGuideQuality {

    private CropGuideQuality() {
    }

    public static boolean isValid(Map<String, Object> aiResponse) {
        if (aiResponse == null || aiResponse.isEmpty()) {
            return false;
        }
        Object topicsObj = aiResponse.get("topics");
        if (!(topicsObj instanceof List<?> topics) || topics.size() < 3) {
            return false;
        }
        int withContent = 0;
        for (Object t : topics) {
            if (!(t instanceof Map<?, ?> topic)) {
                continue;
            }
            Object content = topic.get("content");
            if (content instanceof List<?> lines && lines.size() >= 2) {
                withContent++;
            }
        }
        return withContent >= 3;
    }
}
