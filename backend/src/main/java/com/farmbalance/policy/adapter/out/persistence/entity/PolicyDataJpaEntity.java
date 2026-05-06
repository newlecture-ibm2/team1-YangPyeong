package com.farmbalance.policy.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 정책 데이터 JPA Entity.
 * policy_data 테이블과 매핑됩니다.
 */
@Entity
@Table(name = "policy_data",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_policy_data_external_source",
           columnNames = {"external_id", "source"}
       ))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PolicyDataJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, length = 200)
    private String externalId;

    @Column(name = "source", length = 30)
    private String source;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "organization", length = 200)
    private String organization;

    @Column(name = "region_code", length = 10)
    private String regionCode;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "target", length = 200)
    private String target;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "support_amount", length = 100)
    private String supportAmount;

    @Column(name = "apply_start")
    private LocalDate applyStart;

    @Column(name = "apply_end")
    private LocalDate applyEnd;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "jsonb")
    private String rawData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "normalized_data", columnDefinition = "jsonb")
    private String normalizedData;

    @Column(name = "confidence", precision = 5, scale = 2)
    private BigDecimal confidence;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt;

    /** 기존 하위호환용 data 컬럼 (NOT NULL). content와 동일값 저장. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", nullable = false, columnDefinition = "jsonb")
    private String data;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    public PolicyDataJpaEntity(Long id, String externalId, String source,
                                String title, String organization, String regionCode,
                                String category, String target, String content,
                                String supportAmount, LocalDate applyStart, LocalDate applyEnd,
                                String sourceUrl, String rawData, String normalizedData,
                                BigDecimal confidence, LocalDateTime fetchedAt,
                                LocalDateTime deletedAt) {
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
        this.normalizedData = normalizedData;
        this.confidence = confidence;
        this.fetchedAt = fetchedAt;
        this.deletedAt = deletedAt;
        // data 컬럼: source + raw 정보를 JSON 형태로 저장
        this.data = buildDataField(source, rawData, content);
    }

    /**
     * 도메인 모델로부터 필드를 갱신합니다.
     */
    public void updateFrom(String title, String organization, String regionCode,
                           String category, String target, String content,
                           String supportAmount, LocalDate applyStart, LocalDate applyEnd,
                           String sourceUrl, String rawData, String normalizedData,
                           BigDecimal confidence, LocalDateTime fetchedAt) {
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
        this.normalizedData = normalizedData;
        this.confidence = confidence;
        this.fetchedAt = fetchedAt;
        // data 컬럼 갱신
        this.data = buildDataField(this.source, rawData, content);
    }

    /**
     * data 컬럼용 JSON 문자열 생성.
     * 원본 데이터를 구조화하여 저장합니다.
     */
    private static String buildDataField(String source, String rawData, String content) {
        if (rawData != null && !rawData.isBlank()) {
            return String.format("{\"source\":\"%s\",\"type\":\"raw\",\"content\":%s}",
                    source != null ? source : "unknown", rawData);
        }
        if (content != null && !content.isBlank()) {
            // JSON 특수문자 이스케이프
            String escaped = content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
            return String.format("{\"source\":\"%s\",\"type\":\"text\",\"content\":\"%s\"}",
                    source != null ? source : "unknown", escaped);
        }
        return "{}";
    }
}
