package com.farmbalance.community.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PostCategoryEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 200)
    private String description;

    @Column(name = "display_order")
    private int displayOrder;

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}

