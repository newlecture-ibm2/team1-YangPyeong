package com.farmbalance.recommend.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recommend_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long farmId;
    private String farmName;
    private String farmAddress;
    private Double farmArea;
    private Double soilPh;
    private Double organicMatter;
    private String soilType;
    private String recommendMode;
    private LocalDateTime generatedAt;

    @BatchSize(size = 100)
    @OneToMany(mappedBy = "history", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecommendHistoryItemEntity> items = new ArrayList<>();

    @Builder
    public RecommendHistoryEntity(Long farmId, String farmName, String farmAddress, Double farmArea,
                                  Double soilPh, Double organicMatter, String soilType,
                                  String recommendMode, LocalDateTime generatedAt) {
        this.farmId = farmId;
        this.farmName = farmName;
        this.farmAddress = farmAddress;
        this.farmArea = farmArea;
        this.soilPh = soilPh;
        this.organicMatter = organicMatter;
        this.soilType = soilType;
        this.recommendMode = recommendMode;
        this.generatedAt = generatedAt;
    }

    public void addItem(RecommendHistoryItemEntity item) {
        this.items.add(item);
        item.setHistory(this);
    }
}
