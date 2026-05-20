-- V21: farm_revenue_prediction + farm_crop_detailed_guide
-- 농장·작물별 AI 수익 예측 스냅샷 (대시보드 재진입 시 DB에서 복원)

CREATE TABLE farm_revenue_prediction (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farm_id         BIGINT       NOT NULL,
    crop_name       VARCHAR(100) NOT NULL,
    area_sqm        DOUBLE PRECISION NOT NULL,
    sowing_month    INT,
    actual_yield_kg DOUBLE PRECISION,
    cache_row_key   VARCHAR(320) NOT NULL,
    predicted_yield_kg   DOUBLE PRECISION,
    predicted_price_per_kg INT,
    predicted_revenue    BIGINT,
    price_insight   TEXT,
    revenue_insight TEXT,
    confidence      VARCHAR(30),
    yield_factors   JSONB,
    kamis_raw       JSONB,
    predicted_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_farm_revenue_prediction_farm_row UNIQUE (farm_id, cache_row_key)
);

CREATE INDEX idx_farm_revenue_prediction_farm_predicted
    ON farm_revenue_prediction (farm_id, predicted_at DESC);

COMMENT ON TABLE farm_revenue_prediction IS '농장 작물별 최신 AI 수익·시세 예측 (분석받기/대표 자동분석 결과 저장)';

-- 농장·작물·재배경험 수준별 AI 재배 상세 가이드 캐시 (가이드북 모달)

CREATE TABLE farm_crop_detailed_guide (
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

CREATE INDEX idx_farm_crop_detailed_guide_farm_generated
    ON farm_crop_detailed_guide (farm_id, generated_at DESC);

CREATE INDEX idx_farm_crop_detailed_guide_farm_crop
    ON farm_crop_detailed_guide (farm_id, crop_id);

COMMENT ON TABLE farm_crop_detailed_guide IS '농장·작물·경험수준별 AI 재배 가이드북 (최초 생성 후 DB 캐시)';
COMMENT ON COLUMN farm_crop_detailed_guide.experience_level IS 'novice | experienced';
COMMENT ON COLUMN farm_crop_detailed_guide.guide_version IS '프롬프트/스키마 버전 — 변경 시 재생성';
