package com.farmbalance.gov.adapter.out.persistence.adapter;

import com.farmbalance.gov.application.port.out.RegionQueryPort;
import com.farmbalance.gov.domain.model.Region;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 지역 마스터 조회 Driven Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class RegionPersistenceAdapter implements RegionQueryPort {

    private final JdbcTemplate jdbc;

    @Override
    public List<Region> findTownsByParentCode(String cityCode) {
        String sql = """
            SELECT r.id, r.code, r.name, r.type, p.code AS parent_code
            FROM regions r
            LEFT JOIN regions p ON p.id = r.parent_id
            WHERE p.code = ? AND r.type = 'TOWN' AND r.is_active = TRUE
            ORDER BY r.code
            """;
        return jdbc.query(sql, (rs, i) -> Region.builder()
                .id(rs.getLong("id"))
                .code(rs.getString("code"))
                .name(rs.getString("name"))
                .type(rs.getString("type"))
                .parentCode(rs.getString("parent_code"))
                .build(), cityCode);
    }

    @Override
    public Optional<Region> findByCode(String code) {
        String sql = """
            SELECT r.id, r.code, r.name, r.type, p.code AS parent_code
            FROM regions r LEFT JOIN regions p ON p.id = r.parent_id
            WHERE r.code = ?
            """;
        return jdbc.query(sql, (rs, i) -> Region.builder()
                .id(rs.getLong("id"))
                .code(rs.getString("code"))
                .name(rs.getString("name"))
                .type(rs.getString("type"))
                .parentCode(rs.getString("parent_code"))
                .build(), code).stream().findFirst();
    }
}
