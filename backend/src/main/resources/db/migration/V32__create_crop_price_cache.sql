-- ═══════════════════════════════════════════════════════════════
-- V32: KAMIS 농산물 시세 캐싱 테이블 생성
--
-- 목적: KAMIS API의 일일 호출 횟수 제한과 응답 지연을 방지하기 위해
--       당일 조회한 작물의 가격 데이터를 캐싱하는 테이블
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crop_price_cache (
    id              BIGSERIAL    PRIMARY KEY,
    crop_name       VARCHAR(50)  NOT NULL,       -- 작물명
    price           INT          NOT NULL,       -- 가격 (원)
    unit            VARCHAR(20)  NOT NULL,       -- 단위 (예: 1kg)
    price_date      DATE         NOT NULL,       -- 기준 일자
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 작물명과 기준일자로 빠른 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_crop_price_cache_name_date 
ON crop_price_cache(crop_name, price_date);
