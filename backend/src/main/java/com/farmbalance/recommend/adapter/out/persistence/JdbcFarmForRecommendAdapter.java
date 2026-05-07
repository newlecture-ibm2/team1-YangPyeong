package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 추천용 경량 Farm 조회 어댑터 (JDBC 직접 조회)
 *
 * Hibernate 엔티티 매핑을 거치지 않으므로 컬럼 매핑 이슈를 회피합니다.
 * 추천에 필요한 최소 필드만 조회합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JdbcFarmForRecommendAdapter implements LoadFarmForRecommendPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<FarmBasicData> loadFarmBasic(Long farmId) {
        String sql = """
            SELECT id, name, address, bjd_code, pnu_code,
                   soil_type, soil_ph AS ph, soil_organic_matter AS organic_matter
            FROM farms
            WHERE id = ? AND deleted_at IS NULL
            """;

        try {
            FarmBasicData data = jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                    new FarmBasicDataImpl(
                            rs.getLong("id"),
                            rs.getString("name"),
                            rs.getString("address"),
                            null, // area 컬럼은 DB에서 삭제됨
                            rs.getString("bjd_code"),
                            rs.getString("pnu_code"),
                            rs.getString("soil_type"),
                            rs.getObject("ph") != null ? rs.getDouble("ph") : null,
                            rs.getObject("organic_matter") != null ? rs.getDouble("organic_matter") : null
                    ), farmId);
            return Optional.ofNullable(data);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /** 내부 데이터 클래스 */
    private record FarmBasicDataImpl(
            Long id, String name, String address, Double area,
            String bjdCode, String pnuCode,
            String soilType, Double ph, Double organicMatter
    ) implements FarmBasicData {
        @Override public Long getId() { return id; }
        @Override public String getName() { return name; }
        @Override public String getAddress() { return address; }
        @Override public Double getArea() { return area; }
        @Override public String getBjdCode() { return bjdCode; }
        @Override public String getPnuCode() { return pnuCode; }
        @Override public String getSoilType() { return soilType; }
        @Override public Double getPh() { return ph; }
        @Override public Double getOrganicMatter() { return organicMatter; }
    }
}
