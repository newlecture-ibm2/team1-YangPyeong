package com.farmbalance.gov.adapter.out.persistence;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 지자체 Seed 데이터 초기화
 * - dev 프로필에서만 실행 (운영 서버 보호)
 * - 식별자 기반 삭제 (email suffix, order_number prefix 등)
 * - id BETWEEN 범위 삭제 절대 금지
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class GovSeedDataInitializer {

    private final JdbcTemplate jdbc;

    /** 시드 데이터 식별용 이메일 접미사 */
    private static final String SEED_EMAIL = "%@gov-seed.local";

    @PostConstruct
    public void init() {
        try {
            // regions 마스터 테이블은 시드 유저 존재 여부와 무관하게 항상 확인
            ensureRegionsTable();

            int seedUserCount = countSeedUsers();

            if (seedUserCount >= 32) {
                log.info("[Gov Seed] 시드 데이터가 완전히 존재합니다 ({}명/32명). 스킵합니다.", seedUserCount);
                return;
            }

            if (seedUserCount > 0) {
                log.info("[Gov Seed] 불완전 시드 데이터 감지 ({}명/32명). 정리 후 재삽입합니다.", seedUserCount);
                cleanSeedData();
            }

            executeSeedSql();
        } catch (Exception e) {
            log.error("[Gov Seed] ❌ 시드 데이터 초기화 실패", e);
        }
    }

    /**
     * regions 마스터 테이블이 비어있으면 seed-regions.sql을 실행합니다.
     * 시드 유저와 독립적으로, 지역 마스터 데이터는 항상 존재해야 합니다.
     */
    private void ensureRegionsTable() {
        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM regions WHERE type = 'CITY'", Integer.class);
            if (count != null && count > 0) {
                log.info("[Gov Seed] regions 마스터 테이블 정상 (CITY {}건)", count);
                return;
            }
        } catch (Exception e) {
            log.info("[Gov Seed] regions 테이블 미존재 또는 비어있음 — 생성합니다.");
        }
        executeSqlFile("seed-regions.sql");
    }

    /** 시드 유저 수 조회 */
    private int countSeedUsers() {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email LIKE ?", Integer.class, SEED_EMAIL);
        return count != null ? count : 0;
    }

    /**
     * 시드 데이터만 안전하게 삭제 (식별자 기반, FK 역순)
     * - 이메일: %@gov-seed.local
     * - 주문번호: GS-%
     * - 작물코드: GS_%
     * - 카테고리명: [GS]%
     */
    private void cleanSeedData() {
        safeDelete("download_history",
                "DELETE FROM download_history WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)",
                SEED_EMAIL);

        safeDelete("order_items",
                "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE ?)",
                "GS-%");

        safeDelete("orders",
                "DELETE FROM orders WHERE order_number LIKE ?",
                "GS-%");

        safeDelete("balance_data",
                "DELETE FROM balance_data WHERE crop_id IN (SELECT id FROM crops WHERE code LIKE ?)",
                "GS_%");

        safeDelete("seed_registrations",
                "DELETE FROM seed_registrations WHERE farm_id IN " +
                "(SELECT id FROM farms WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?))",
                SEED_EMAIL);

        safeDelete("products",
                "DELETE FROM products WHERE seller_id IN (SELECT id FROM users WHERE email LIKE ?)",
                SEED_EMAIL);

        safeDelete("product_categories",
                "DELETE FROM product_categories WHERE name LIKE ?",
                "[GS]%");

        safeDelete("farms",
                "DELETE FROM farms WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)",
                SEED_EMAIL);

        safeDelete("crops",
                "DELETE FROM crops WHERE code LIKE ?",
                "GS_%");

        safeDelete("crop_categories",
                "DELETE FROM crop_categories WHERE name LIKE ?",
                "[GS]%");

        safeDelete("users",
                "DELETE FROM users WHERE email LIKE ?",
                SEED_EMAIL);
    }

    /** 삭제 건수 로깅 후 실행. 실패 시 에러 로그. */
    private void safeDelete(String table, String sql, String param) {
        try {
            int deleted = jdbc.update(sql, param);
            if (deleted > 0) {
                log.info("[Gov Seed] {} 테이블에서 {}건 삭제", table, deleted);
            }
        } catch (Exception e) {
            log.error("[Gov Seed] {} 삭제 실패: {}", table, e.getMessage());
        }
    }

    /** seed-regions.sql → seed-gov.sql 순서로 실행 */
    private void executeSeedSql() {
        executeSqlFile("seed-regions.sql");
        executeSqlFile("seed-gov.sql");
    }

    /** SQL 파일 읽어서 실행 */
    private void executeSqlFile(String filename) {
        try {
            ClassPathResource resource = new ClassPathResource(filename);
            List<String> statements = new ArrayList<>();
            StringBuilder sb = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("--")) continue;
                    sb.append(line).append("\n");
                    if (trimmed.endsWith(";")) {
                        String stmt = sb.toString().trim();
                        stmt = stmt.substring(0, stmt.length() - 1).trim();
                        if (!stmt.isEmpty()) {
                            statements.add(stmt);
                        }
                        sb.setLength(0);
                    }
                }
            }

            int executed = 0;
            for (String stmt : statements) {
                try {
                    jdbc.execute(stmt);
                    executed++;
                } catch (Exception e) {
                    log.warn("[Gov Seed] [{}] SQL 실행 실패: {}", filename, e.getMessage());
                }
            }
            log.info("[Gov Seed] ✅ {} — {} / {} 건 실행 완료", filename, executed, statements.size());
        } catch (Exception e) {
            log.error("[Gov Seed] ❌ {} 파일 실행 실패", filename, e);
        }
    }
}

