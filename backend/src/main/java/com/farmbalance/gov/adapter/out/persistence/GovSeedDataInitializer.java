package com.farmbalance.gov.adapter.out.persistence;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * seed-gov.sql 을 앱 기동 시 한 번 실행합니다.
 * 이미 데이터가 있으면 스킵 (멱등).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GovSeedDataInitializer {

    private final JdbcTemplate jdbc;

    @PostConstruct
    public void init() {
        try {
            Integer userCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id BETWEEN 9000 AND 9040", Integer.class);
            Integer orderCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE id BETWEEN 9000 AND 9100", Integer.class);
            Integer farmCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM farms WHERE id BETWEEN 9000 AND 9030", Integer.class);
            Integer balanceCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM balance_data WHERE id BETWEEN 9000 AND 9100", Integer.class);

            if (userCount != null && userCount == 31 && 
                orderCount != null && orderCount >= 45 &&
                farmCount != null && farmCount == 25 &&
                balanceCount != null && balanceCount == 28) {
                log.info("[Gov Seed] 이미 시드 데이터가 완전히 존재합니다. 스킵합니다.");
                return;
            }

            // 불완전 데이터가 있으면 정리
            if (userCount != null && userCount > 0 || farmCount != null && farmCount > 0) {
                log.info("[Gov Seed] 불완전 시드 데이터 감지 (유저 {}/31, 농가 {}/25). 정리 후 재삽입합니다.", userCount, farmCount);
                
                try {
                    jdbc.execute("ALTER TABLE farms ALTER COLUMN area DROP NOT NULL");
                } catch (Exception ignored) {}

                try {
                    jdbc.execute("DELETE FROM download_history WHERE user_id BETWEEN 9000 AND 9050");
                } catch (Exception ignored) {}

                jdbc.execute("DELETE FROM order_items WHERE id BETWEEN 9000 AND 9100");
                jdbc.execute("DELETE FROM orders WHERE id BETWEEN 9000 AND 9100");
                jdbc.execute("DELETE FROM balance_data WHERE id BETWEEN 9000 AND 9100");
                jdbc.execute("DELETE FROM seed_registrations WHERE id BETWEEN 9000 AND 9200");
                jdbc.execute("DELETE FROM products WHERE id BETWEEN 9000 AND 9020");
                jdbc.execute("DELETE FROM product_categories WHERE id BETWEEN 9000 AND 9005");
                jdbc.execute("DELETE FROM farms WHERE id BETWEEN 9000 AND 9030");
                jdbc.execute("DELETE FROM crops WHERE id BETWEEN 9000 AND 9010");
                jdbc.execute("DELETE FROM crop_categories WHERE id BETWEEN 9000 AND 9005");
                jdbc.execute("DELETE FROM users WHERE id BETWEEN 9000 AND 9050");
            }

            ClassPathResource resource = new ClassPathResource("seed-gov.sql");
            List<String> statements = new ArrayList<>();
            StringBuilder sb = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    // 주석과 빈 줄 무시
                    if (trimmed.isEmpty() || trimmed.startsWith("--")) continue;
                    sb.append(line).append("\n");
                    if (trimmed.endsWith(";")) {
                        // 세미콜론에서 분할
                        String stmt = sb.toString().trim();
                        stmt = stmt.substring(0, stmt.length() - 1).trim(); // 세미콜론 제거
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
                    log.warn("[Gov Seed] SQL 실행 실패: {}", e.getMessage());
                }
            }
            log.info("[Gov Seed] ✅ 시드 데이터 {} / {} 건 실행 완료", executed, statements.size());
        } catch (Exception e) {
            log.error("[Gov Seed] ❌ 시드 데이터 초기화 실패", e);
        }
    }
}
