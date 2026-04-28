package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.GovDomain.*;
import java.util.List;

/**
 * 재배 현황 조회 UseCase
 */
public interface GetCultivationStatusUseCase {
    List<CultivationRow> getCultivationStatus(Integer year, String region, String crop);
}
