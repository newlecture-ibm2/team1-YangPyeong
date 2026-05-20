package com.farmbalance.global.service;

import com.farmbalance.global.util.RegionCodeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * AI 분석 결과의 region_code/region_name을 regions 테이블 기준으로 보정하는 공통 Resolver.
 *
 * 순수 보정 로직은 {@link RegionCodeUtils}에 위임하고,
 * 이 클래스는 regions DB 조회만 담당합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RegionCodeResolver {

    private final JdbcTemplate jdbcTemplate;

    public Optional<String> resolveToCode(String codeOrName) {
        if (codeOrName == null || codeOrName.isBlank()) {
            return Optional.empty();
        }

        String input = codeOrName.trim();

        // 1. 전국/공통 특수 매핑 (DB 불필요)
        Optional<String> special = RegionCodeUtils.resolveSpecial(input);
        if (special.isPresent()) {
            return special;
        }

        // 2. 숫자 코드 → 후보 목록 생성 후 DB 매칭
        if (RegionCodeUtils.isNumericCode(input)) {
            return resolveByCodeCandidates(input);
        }

        // 3. 한글 이름 → DB name 검색
        return resolveByName(input);
    }

    /**
     * 입력된 지역명, 10자리 법정동코드, 4자리 시군구 코드를
     * DB 매칭 및 정규화를 거쳐 무조건 4자리 시군구 코드로 최종 반환합니다.
     */
    public String resolveToSigunguCode(String codeOrName) {
        if (codeOrName == null || codeOrName.isBlank()) {
            return null;
        }

        String resolved = resolveToCode(codeOrName).orElse(codeOrName);
        String sigungu = RegionCodeUtils.extractSigunguFromBjd(resolved);
        return sigungu != null ? sigungu : RegionCodeUtils.normalizeCode(resolved);
    }

    /**
     * 숫자 코드 후보 목록을 생성하고 DB에서 매칭합니다.
     */
    private Optional<String> resolveByCodeCandidates(String code) {
        List<String> candidates = RegionCodeUtils.normalizeCandidates(code);

        for (String candidate : candidates) {
            if (existsCode(candidate)) {
                if (!candidate.equals(code)) {
                    log.info("[RegionResolve] 코드 보정: {} → {}", code, candidate);
                }
                return Optional.of(candidate);
            }
        }

        log.warn("[RegionResolve] 코드 매칭 실패: {}", code);
        return Optional.empty();
    }

    /**
     * 한글 이름으로 regions 테이블에서 코드를 검색합니다.
     */
    private Optional<String> resolveByName(String name) {
        // 정확한 이름 매칭
        String exactSql = "SELECT code FROM regions WHERE name = ? AND is_active = TRUE LIMIT 1";
        List<String> exactCodes = jdbcTemplate.queryForList(exactSql, String.class, name);
        if (!exactCodes.isEmpty()) {
            return Optional.of(exactCodes.get(0));
        }

        // LIKE 매칭 (양평 → 양평군), 세부 지역 우선 (코드 길이 DESC)
        String likeSql = "SELECT code FROM regions WHERE name LIKE ? AND is_active = TRUE ORDER BY LENGTH(code) DESC LIMIT 1";
        List<String> likeCodes = jdbcTemplate.queryForList(likeSql, String.class, "%" + name + "%");
        if (!likeCodes.isEmpty()) {
            log.info("[RegionResolve] LIKE 매칭: {} → {}", name, likeCodes.get(0));
            return Optional.of(likeCodes.get(0));
        }

        log.warn("[RegionResolve] 이름 매칭 실패: {}", name);
        return Optional.empty();
    }

    private boolean existsCode(String code) {
        String sql = "SELECT COUNT(*) FROM regions WHERE code = ? AND is_active = TRUE";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, code);
        return count != null && count > 0;
    }
}
