package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.LoadSupplyStatusPort;
import com.farmbalance.recommend.domain.SupplyStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 수급 상태 실 데이터 어댑터
 *
 * balance_data 테이블에서 해당 작물 + 지역의 최신 수급 상태를 조회합니다.
 *
 * @Primary 로 MockSupplyStatusAdapter 보다 우선 적용됩니다.
 */
@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class JdbcSupplyStatusAdapter implements LoadSupplyStatusPort {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 특정 작물의 현재 수급 상태를 조회합니다.
     *
     * 조회 전략:
     * 1. 정확한 region_code 매칭을 먼저 시도
     * 2. 없으면 상위 시군구 코드로 폴백
     * 3. 그래도 없으면 전국 데이터로 폴백
     * 4. 데이터 없으면 BALANCED 반환
     */
    @Override
    public SupplyStatus loadSupplyStatus(Long cropId, String regionCode) {
        String sigunguCode = regionCode != null && regionCode.length() >= 5
                ? regionCode.substring(0, 5)
                : regionCode != null ? regionCode : "";

        // 1. 정확한 코드로 최신 수급 상태 조회
        String sql = """
            SELECT balance_status
            FROM balance_data
            WHERE crop_id = ?
              AND region_code LIKE ?
              AND deleted_at IS NULL
            ORDER BY year DESC, season DESC
            LIMIT 1
            """;

        String status = queryStatus(sql, cropId, sigunguCode + "%");

        // 2. 데이터가 없으면 전국 데이터로 폴백
        if (status == null && !sigunguCode.isEmpty()) {
            status = queryStatus(sql, cropId, "%");
        }

        if (status == null) {
            log.debug("수급 데이터 없음: cropId={}, region={} → BALANCED 반환", cropId, regionCode);
            return SupplyStatus.BALANCED;
        }

        try {
            return SupplyStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            log.warn("알 수 없는 수급 상태 '{}' → BALANCED 반환", status);
            return SupplyStatus.BALANCED;
        }
    }

    private String queryStatus(String sql, Long cropId, String regionPattern) {
        try {
            return jdbcTemplate.queryForObject(sql, String.class, cropId, regionPattern);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
