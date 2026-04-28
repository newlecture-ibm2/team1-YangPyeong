package com.farmbalance.gov.application.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.farmbalance.gov.domain.model.GovUserInfo;

public interface GovDataQueryPort {
    List<Map<String, Object>> queryCultivation(LocalDate startDate, LocalDate endDate, String govRegion, String town);
    List<Map<String, Object>> queryBalance(LocalDate startDate, LocalDate endDate, String govRegion, String town);
    List<Map<String, Object>> querySales(LocalDate startDate, LocalDate endDate, String govRegion, String town);
    List<Map<String, Object>> queryFarms(LocalDate startDate, LocalDate endDate, String govRegion, String town);
    GovUserInfo getGovUserInfo(Long userId);
}
