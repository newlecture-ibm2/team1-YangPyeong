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
}
