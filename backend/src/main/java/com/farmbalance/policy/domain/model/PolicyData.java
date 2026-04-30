package com.farmbalance.policy.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 정책 도메인 모델 (순수 POJO).
 * Spring / JPA 어노테이션 사용 금지.
 */
public class PolicyData {

    private Long id;
    private String externalId;
    private PolicySource source;
    private String title;
    private String organization;
    private String regionCode;
    private String category;
    private String target;
    private String content;
    private String supportAmount;
    private LocalDate applyStart;
    private LocalDate applyEnd;
    private String sourceUrl;
    private String rawData;
    private LocalDateTime fetchedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    /** 기본 생성자 */
    public PolicyData() {
    }

    /** 전체 필드 생성자 */
    public PolicyData(Long id, String externalId, PolicySource source,
                      String title, String organization, String regionCode,
                      String category, String target, String content,
                      String supportAmount, LocalDate applyStart, LocalDate applyEnd,
                      String sourceUrl, String rawData, LocalDateTime fetchedAt,
                      LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime deletedAt) {
        this.id = id;
        this.externalId = externalId;
        this.source = source;
        this.title = title;
        this.organization = organization;
        this.regionCode = regionCode;
        this.category = category;
        this.target = target;
        this.content = content;
        this.supportAmount = supportAmount;
        this.applyStart = applyStart;
        this.applyEnd = applyEnd;
        this.sourceUrl = sourceUrl;
        this.rawData = rawData;
        this.fetchedAt = fetchedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    // ── Getters ──

    public Long getId() { return id; }
    public String getExternalId() { return externalId; }
    public PolicySource getSource() { return source; }
    public String getTitle() { return title; }
    public String getOrganization() { return organization; }
    public String getRegionCode() { return regionCode; }
    public String getCategory() { return category; }
    public String getTarget() { return target; }
    public String getContent() { return content; }
    public String getSupportAmount() { return supportAmount; }
    public LocalDate getApplyStart() { return applyStart; }
    public LocalDate getApplyEnd() { return applyEnd; }
    public String getSourceUrl() { return sourceUrl; }
    public String getRawData() { return rawData; }
    public LocalDateTime getFetchedAt() { return fetchedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }

    // ── Setters ──

    public void setId(Long id) { this.id = id; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public void setSource(PolicySource source) { this.source = source; }
    public void setTitle(String title) { this.title = title; }
    public void setOrganization(String organization) { this.organization = organization; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }
    public void setCategory(String category) { this.category = category; }
    public void setTarget(String target) { this.target = target; }
    public void setContent(String content) { this.content = content; }
    public void setSupportAmount(String supportAmount) { this.supportAmount = supportAmount; }
    public void setApplyStart(LocalDate applyStart) { this.applyStart = applyStart; }
    public void setApplyEnd(LocalDate applyEnd) { this.applyEnd = applyEnd; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public void setRawData(String rawData) { this.rawData = rawData; }
    public void setFetchedAt(LocalDateTime fetchedAt) { this.fetchedAt = fetchedAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    /**
     * 내용 요약 (200자 제한)
     */
    public String getContentSummary() {
        if (content == null) return "";
        return content.length() > 200 ? content.substring(0, 200) + "..." : content;
    }
}
