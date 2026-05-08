package com.farmbalance.recommend.domain;

/**
 * 작물 카테고리
 */
public enum CropCategory {

    VEGETABLE("채소류"),
    FRUIT("과일류"),
    GRAIN("곡물"),
    SPECIAL("특용작물"),
    FLOWER("화훼류");

    private final String label;

    CropCategory(String label) {
        this.label = label;
    }

    public String getLabel() { return label; }

    /**
     * label 문자열로부터 CropCategory를 찾습니다.
     * 정확 매칭 → 부분 매칭 → 기본값(VEGETABLE) 순서로 시도합니다.
     */
    public static CropCategory fromLabel(String label) {
        if (label == null) return VEGETABLE;

        // 정확 매칭
        for (CropCategory cat : values()) {
            if (cat.label.equals(label)) return cat;
        }

        // 부분 매칭
        String lower = label.toLowerCase();
        if (lower.contains("채소") || lower.contains("엽근")) return VEGETABLE;
        if (lower.contains("과일") || lower.contains("과수")) return FRUIT;
        if (lower.contains("곡") || lower.contains("미곡") || lower.contains("맥류")) return GRAIN;
        if (lower.contains("특용") || lower.contains("약용")) return SPECIAL;
        if (lower.contains("화훼") || lower.contains("꽃")) return FLOWER;

        return VEGETABLE;
    }
}
