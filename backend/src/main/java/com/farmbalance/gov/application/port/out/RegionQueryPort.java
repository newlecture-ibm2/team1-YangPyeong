package com.farmbalance.gov.application.port.out;

import com.farmbalance.gov.domain.model.Region;
import java.util.List;
import java.util.Optional;

/**
 * 지역 마스터 조회 Output Port
 */
public interface RegionQueryPort {

    /** 시군구 코드로 하위 읍면동 목록 조회 */
    List<Region> findTownsByParentCode(String cityCode);

    /** 코드로 지역 단건 조회 */
    Optional<Region> findByCode(String code);
}
