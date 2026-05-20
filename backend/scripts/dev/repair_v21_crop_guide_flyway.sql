-- 로컬 DB 정리: V35/V36 flyway 이력 제거 후 V21 DDL로 farm_crop_detailed_guide만 재생성
-- (V21은 이미 적용된 상태라 flyway_schema_history의 21번은 건드리지 않음)
--
-- 실행 예 (dev DB):
--   psql -h localhost -p 5151 -U postgres -d farm_db -f backend/scripts/dev/repair_v21_crop_guide_flyway.sql

-- V36(또는 수동 생성) 가이드 테이블 제거
DROP TABLE IF EXISTS farm_crop_detailed_guide CASCADE;

-- V35/V36 flyway 이력 제거 (V35가 다른 기능이면 version='35' 행만 팀과 확인 후 삭제)
DELETE FROM flyway_schema_history
WHERE version IN ('35', '36');

-- V21에 정의된 farm_crop_detailed_guide (farm_revenue_prediction은 V21 기존 적용 유지)
CREATE TABLE IF NOT EXISTS farm_crop_detailed_guide (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farm_id           BIGINT       NOT NULL,
    crop_id           BIGINT       NOT NULL,
    crop_name         VARCHAR(100) NOT NULL,
    experience_level  VARCHAR(20)  NOT NULL,
    guide_version     INT          NOT NULL DEFAULT 1,
    cache_key         VARCHAR(200) NOT NULL,
    topics_json       JSONB        NOT NULL,
    generated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_farm_crop_detailed_guide_farm_key UNIQUE (farm_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_farm_crop_detailed_guide_farm_generated
    ON farm_crop_detailed_guide (farm_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_farm_crop_detailed_guide_farm_crop
    ON farm_crop_detailed_guide (farm_id, crop_id);

COMMENT ON TABLE farm_crop_detailed_guide IS '농장·작물·경험수준별 AI 재배 가이드북 (최초 생성 후 DB 캐시)';
COMMENT ON COLUMN farm_crop_detailed_guide.experience_level IS 'novice | experienced';
COMMENT ON COLUMN farm_crop_detailed_guide.guide_version IS '프롬프트/스키마 버전 — 변경 시 재생성';
