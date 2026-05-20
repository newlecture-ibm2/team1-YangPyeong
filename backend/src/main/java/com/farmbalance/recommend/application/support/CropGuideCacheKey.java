package com.farmbalance.recommend.application.support;

/**
 * 재배 가이드북 DB 캐시 키 (프론트엔드·AI 서버와 동일 규칙 유지)
 */
public final class CropGuideCacheKey {

    public static final int GUIDE_VERSION = 1;

    private CropGuideCacheKey() {
    }

    public static String build(long cropId, String experienceLevel) {
        String level = normalizeExperience(experienceLevel);
        return "crop:" + cropId + ":exp:" + level + ":v" + GUIDE_VERSION;
    }

    public static String normalizeExperience(String experienceLevel) {
        if (experienceLevel == null) {
            return "novice";
        }
        String v = experienceLevel.trim().toLowerCase();
        return "experienced".equals(v) ? "experienced" : "novice";
    }
}
