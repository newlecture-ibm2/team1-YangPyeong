-- V31 파일 수정 후 Flyway checksum 불일치 시 (이미 V31 적용된 로컬 DB)
--
-- 1) 고구마 이상치가 아직 남아 있으면 보정 (구 V31은 crop_id=19만 대상)
UPDATE cultivation_registrations
SET cultivation_area = 30000,
    farmer_estimated_yield = 29.31
WHERE cultivation_area > 500000
  AND crop_id = (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1)
  AND deleted_at IS NULL;

-- 2) Flyway checksum 갱신 (Spring Boot 기동 전 1회)
--    ./gradlew flywayRepair  또는 아래로 checksum 직접 맞추기:
-- UPDATE flyway_schema_history
-- SET checksum = NULL
-- WHERE version = '31';
-- (권장: Gradle flywayRepair 사용)
