package com.farmbalance.farm.domain;

/**
 * 재배 등록 상태
 * - ACTIVE: 재배중 (면적 합산에 포함)
 * - COMPLETED: 수확 완료 (면적 합산에서 제외)
 */
public enum CultivationStatus {
    ACTIVE,
    COMPLETED
}
