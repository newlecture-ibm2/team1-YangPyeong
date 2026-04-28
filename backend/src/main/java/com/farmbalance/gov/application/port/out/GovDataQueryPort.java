package com.farmbalance.gov.application.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 지자체 데이터 조회 Output Port
 * adapter/out/persistence에서 구현합니다.
 */
public interface GovDataQueryPort {

    /** 재배 현황 조회 */
    List<Map<String, Object>> queryCultivation(LocalDate startDate, LocalDate endDate, String town);

    /** 수급 현황 조회 */
    List<Map<String, Object>> queryBalance(LocalDate startDate, LocalDate endDate, String town);

    /** 판매 데이터 조회 */
    List<Map<String, Object>> querySales(LocalDate startDate, LocalDate endDate, String town);

    /** 농가 목록 조회 */
    List<Map<String, Object>> queryFarms(LocalDate startDate, LocalDate endDate, String town);
}
