-- =============================================
-- V9: 정책 원본 데이터 테이블 추가
-- PolicyDataJpaEntity와 매핑 (BaseTimeEntity 상속)
-- =============================================

CREATE TABLE policy_data (
    id               BIGSERIAL     PRIMARY KEY,
    external_id      VARCHAR(200)  NOT NULL,                  -- 외부 API의 원본 ID
    source           VARCHAR(30),                             -- gov24, ksis 등 데이터 출처
    title            VARCHAR(500),
    organization     VARCHAR(200),                            -- 시행 기관
    region_code      VARCHAR(10),
    category         VARCHAR(50),
    target           VARCHAR(200),                            -- 지원 대상
    content          TEXT,
    support_amount   VARCHAR(100),                            -- 지원 금액 (문자열 - "최대 500만원" 등)
    apply_start      DATE,
    apply_end        DATE,
    source_url       VARCHAR(1000),
    raw_data         JSONB,                                   -- 외부 API 원본 응답
    normalized_data  JSONB,                                   -- 정규화된 데이터
    confidence       DECIMAL(5,2),                            -- 매칭 신뢰도 (LLM 분석 결과)
    fetched_at       TIMESTAMP     NOT NULL,                  -- 외부 API 호출 시점
    data             JSONB         NOT NULL,                  -- 하위호환용 구조화 JSON
    deleted_at       TIMESTAMP,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    CONSTRAINT uk_policy_data_external_source UNIQUE (external_id, source)
);

CREATE INDEX idx_policy_data_region      ON policy_data (region_code);
CREATE INDEX idx_policy_data_category    ON policy_data (category);
CREATE INDEX idx_policy_data_apply_dates ON policy_data (apply_start, apply_end);
