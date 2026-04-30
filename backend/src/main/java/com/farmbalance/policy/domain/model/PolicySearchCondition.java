package com.farmbalance.policy.domain.model;

import java.math.BigDecimal;

/**
 * 정책 검색 조건 Value Object.
 * 순수 Java — Spring 의존 없음.
 */
public class PolicySearchCondition {

    private final String keyword;
    private final String regionCode;
    private final String category;
    private final String period;
    private final BigDecimal minConfidence;
    private final int page;
    private final int size;

    public PolicySearchCondition(String keyword, String regionCode,
                                  String category, String period,
                                  int page, int size) {
        this(keyword, regionCode, category, period, null, page, size);
    }

    public PolicySearchCondition(String keyword, String regionCode,
                                  String category, String period,
                                  BigDecimal minConfidence,
                                  int page, int size) {
        this.keyword = keyword;
        this.regionCode = regionCode;
        this.category = category;
        this.period = period;
        this.minConfidence = minConfidence;
        this.page = Math.max(0, page);
        this.size = size > 0 ? Math.min(size, 100) : 10;
    }

    public String getKeyword() { return keyword; }
    public String getRegionCode() { return regionCode; }
    public String getCategory() { return category; }
    public String getPeriod() { return period; }
    public BigDecimal getMinConfidence() { return minConfidence; }
    public int getPage() { return page; }
    public int getSize() { return size; }

    public boolean hasKeyword() { return keyword != null && !keyword.isBlank(); }
    public boolean hasRegionCode() { return regionCode != null && !regionCode.isBlank(); }
    public boolean hasCategory() { return category != null && !category.isBlank(); }
    public boolean hasPeriod() { return period != null && !period.isBlank(); }
    public boolean hasMinConfidence() { return minConfidence != null; }
}
