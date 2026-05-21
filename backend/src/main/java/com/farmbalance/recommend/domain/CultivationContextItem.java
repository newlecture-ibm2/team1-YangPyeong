package com.farmbalance.recommend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/** 추천 분석용 — 농장의 재배 등록 1건 스냅샷 */
@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class CultivationContextItem {

    private Long registrationId;
    private Long cropId;
    private String cropName;
    private Double cultivationAreaSqm;
    private Double farmerEstimatedYield;
    private String yieldUnit;
    private CultivationRegistrationStatus registrationStatus;
    private LocalDate sowingDate;
    /** SYSTEM 이력 제외한 실제 재배 활동·수확·파종일·in_season 플래그로 판별 */
    private boolean inSeason;
    private int realActivityCount;
    private boolean hasHarvestRecord;
    private Double totalHarvestKg;
    private List<String> recentActivitySummaries;

    public enum CultivationRegistrationStatus {
        ACTIVE, COMPLETED, PLANNED
    }
}
