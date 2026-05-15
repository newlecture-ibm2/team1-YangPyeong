package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminBalanceData;

import java.util.List;

/**
 * ADM-005 밸런스 엔진 관리 / ADM-011 대시보드용 Output Port
 */
public interface AdminBalanceDataPort {

    List<AdminBalanceData> findAll();

    List<AdminBalanceData> findByRegionAndCrop(String regionCode, Long cropId);

    void updateBalanceStatuses(double excessWarn, double excessCaution, double shortWarn, double shortCaution);
}
