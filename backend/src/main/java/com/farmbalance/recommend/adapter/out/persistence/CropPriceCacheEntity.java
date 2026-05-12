package com.farmbalance.recommend.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crop_price_cache")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class CropPriceCacheEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "crop_name", nullable = false, length = 50)
    private String cropName;

    @Column(name = "price", nullable = false)
    private Integer price;

    @Column(name = "unit", nullable = false, length = 20)
    private String unit;

    @Column(name = "price_date", nullable = false)
    private LocalDate priceDate;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public CropPriceCacheEntity(String cropName, Integer price, String unit, LocalDate priceDate) {
        this.cropName = cropName;
        this.price = price;
        this.unit = unit;
        this.priceDate = priceDate;
    }
}
