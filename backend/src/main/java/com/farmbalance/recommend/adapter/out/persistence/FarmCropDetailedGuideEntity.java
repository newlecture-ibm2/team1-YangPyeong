package com.farmbalance.recommend.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "farm_crop_detailed_guide")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FarmCropDetailedGuideEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long farmId;

    @Column(nullable = false)
    private Long cropId;

    @Column(nullable = false, length = 100)
    private String cropName;

    @Column(nullable = false, length = 20)
    private String experienceLevel;

    @Column(nullable = false)
    private Integer guideVersion;

    @Column(nullable = false, length = 200)
    private String cacheKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "topics_json", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> topicsJson;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @SuppressWarnings("unchecked")
    public static FarmCropDetailedGuideEntity fromAiSnapshot(
            Long farmId,
            long cropId,
            String cropName,
            String experienceLevel,
            int guideVersion,
            String cacheKey,
            Map<String, Object> aiResponse
    ) {
        FarmCropDetailedGuideEntity e = new FarmCropDetailedGuideEntity();
        e.farmId = farmId;
        e.cropId = cropId;
        e.cropName = cropName;
        e.experienceLevel = experienceLevel;
        e.guideVersion = guideVersion;
        e.cacheKey = cacheKey;
        Object topics = aiResponse.get("topics");
        if (topics instanceof List<?> list) {
            e.topicsJson = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    e.topicsJson.add((Map<String, Object>) m);
                }
            }
        } else {
            e.topicsJson = List.of();
        }
        e.generatedAt = LocalDateTime.now();
        return e;
    }

    public void updateFromSnapshot(Map<String, Object> aiResponse) {
        Object topics = aiResponse.get("topics");
        if (topics instanceof List<?> list) {
            this.topicsJson = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cast = (Map<String, Object>) m;
                    this.topicsJson.add(cast);
                }
            }
        }
        if (aiResponse.get("crop_name") != null) {
            this.cropName = aiResponse.get("crop_name").toString();
        }
        this.generatedAt = LocalDateTime.now();
    }

    public Map<String, Object> toResponseMap() {
        LinkedHashMap<String, Object> map = new LinkedHashMap<>();
        map.put("crop_name", cropName);
        map.put("crop_id", cropId);
        map.put("experience_level", experienceLevel);
        map.put("guide_version", guideVersion);
        map.put("topics", topicsJson != null ? topicsJson : List.of());
        map.put("generated_at", generatedAt.toString());
        map.put("source", "cache");
        return map;
    }
}
