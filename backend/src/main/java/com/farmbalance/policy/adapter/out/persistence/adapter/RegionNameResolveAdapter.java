package com.farmbalance.policy.adapter.out.persistence.adapter;

import com.farmbalance.policy.application.port.out.RegionNameResolvePort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 지역코드 → 지역명 변환 Adapter.
 * regions 마스터 테이블을 직접 JdbcTemplate으로 조회합니다.
 * gov 도메인에 의존하지 않습니다.
 */
@Component
@RequiredArgsConstructor
public class RegionNameResolveAdapter implements RegionNameResolvePort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<String> findNameByCode(String regionCode) {
        if (regionCode == null || regionCode.isBlank()) {
            return Optional.empty();
        }

        // 전국(0000)은 DB에 없을 수 있으므로 직접 처리
        if ("0000".equals(regionCode)) {
            return Optional.of("전국");
        }

        String sql = "SELECT name FROM regions WHERE code = ? AND is_active = TRUE LIMIT 1";
        List<String> names = jdbcTemplate.queryForList(sql, String.class, regionCode);
        return names.stream().findFirst();
    }
}
