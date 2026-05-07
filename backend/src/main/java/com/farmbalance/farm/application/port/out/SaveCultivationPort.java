package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.CultivationRegistration;

import java.util.List;

/**
 * 재배 등록 저장 Output Port
 */
public interface SaveCultivationPort {

    /**
     * 재배 등록 정보를 일괄 저장합니다 (기존 등록 소프트 삭제 후 재생성).
     */
    List<CultivationRegistration> saveCultivationRegistrations(Long farmId, List<CultivationRegistration> registrations);

    /**
     * 재배 등록을 개별 추가합니다 (기존 등록 유지).
     */
    CultivationRegistration addCultivationRegistration(CultivationRegistration registration);
    void updateCultivationRegistration(CultivationRegistration registration);
    void deleteCultivationRegistration(Long id);
}

