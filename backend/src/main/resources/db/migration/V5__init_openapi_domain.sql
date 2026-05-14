-- =============================================
-- V5: 공공 API & 외부 데이터 도메인 (최종 통합 스키마)
-- regions, weather_data, soil_exam_data, crop_production_stats,
-- soil_fitness_data, crop_guides, pest_occurrence_reports,
-- policy_data, api_sync_status, download_history,
-- nongsaro tables, balance_data
-- =============================================

-- 1. regions
CREATE TABLE regions (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(10) NOT NULL UNIQUE,
    name       VARCHAR(30) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('PROVINCE','CITY','TOWN')),
    parent_id  BIGINT REFERENCES regions(id),
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_regions_parent ON regions(parent_id);
CREATE INDEX idx_regions_type ON regions(type);

-- 2. weather_data
CREATE TABLE weather_data (
    id              BIGSERIAL    PRIMARY KEY,
    stn_id          VARCHAR(10)  NOT NULL,
    stn_name        VARCHAR(20),
    obs_date        DATE         NOT NULL,
    avg_temp        DECIMAL(5,1),
    min_temp        DECIMAL(5,1),
    max_temp        DECIMAL(5,1),
    total_rain      DECIMAL(7,1),
    avg_humidity    DECIMAL(5,1),
    sunshine_hours  DECIMAL(5,1),
    avg_wind_speed  DECIMAL(5,1),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    UNIQUE (stn_id, obs_date)
);

-- 3. soil_exam_data
CREATE TABLE soil_exam_data (
    id               BIGSERIAL    PRIMARY KEY,
    pnu_code         VARCHAR(19)  NOT NULL,
    addr_name        VARCHAR(100),
    exam_year        INT          NOT NULL,
    exam_date        DATE,
    ph               DECIMAL(4,2),
    organic_matter   DECIMAL(6,2),
    avail_phosphate  DECIMAL(8,2),
    avail_silica     DECIMAL(8,2),
    potassium        DECIMAL(6,3),
    calcium          DECIMAL(6,3),
    magnesium        DECIMAL(6,3),
    ec               DECIMAL(6,3),
    data_source      VARCHAR(20)  NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    UNIQUE (pnu_code, exam_year)
);
CREATE INDEX idx_soil_pnu ON soil_exam_data(pnu_code);

-- 4. crop_production_stats
CREATE TABLE crop_production_stats (
    id               BIGSERIAL     PRIMARY KEY,
    itm_nm           VARCHAR(50)   NOT NULL,
    region_code      VARCHAR(10)   NOT NULL,
    region_name      VARCHAR(20),
    year             INT           NOT NULL,
    cultivated_area  DECIMAL(12,2),
    yield_per_10a    DECIMAL(10,2),
    total_production DECIMAL(14,2),
    unit_nm          VARCHAR(10),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    UNIQUE (itm_nm, region_code, year)
);

-- 5. soil_fitness_data
CREATE TABLE soil_fitness_data (
    id              BIGSERIAL    PRIMARY KEY,
    soil_crop_cd    VARCHAR(10)  NOT NULL,
    soil_crop_nm    VARCHAR(50)  NOT NULL,
    bjd_code        VARCHAR(10)  NOT NULL,
    bjd_name        VARCHAR(50),
    data_year       INT,
    high_suit_area  DECIMAL(10,2),
    suit_area       DECIMAL(10,2),
    poss_area       DECIMAL(10,2),
    low_suit_area   DECIMAL(10,2),
    etc_area        DECIMAL(10,2),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    UNIQUE (soil_crop_cd, bjd_code, data_year)
);

-- 6. crop_guides
CREATE TABLE crop_guides (
    id                  BIGSERIAL    PRIMARY KEY,
    sub_category_code   VARCHAR(20)  NOT NULL,
    sub_category_nm     VARCHAR(50)  NOT NULL,
    ebook_code          VARCHAR(10),
    ebook_name          VARCHAR(100),
    ebook_pdf_url       VARCHAR(500),
    ebook_img_url       VARCHAR(500),
    index_data          JSONB,
    variety_count       INT,
    variety_data        JSONB,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP,
    UNIQUE (sub_category_code)
);

-- 7. pest_occurrence_reports
CREATE TABLE pest_occurrence_reports (
    id            BIGSERIAL    PRIMARY KEY,
    cntnts_no     VARCHAR(20)  NOT NULL UNIQUE,
    title         VARCHAR(200) NOT NULL,
    report_year   INT          NOT NULL,
    pdf_url       VARCHAR(500),
    file_name     VARCHAR(200),
    published_at  DATE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);
CREATE INDEX idx_pest_reports_year ON pest_occurrence_reports(report_year);

-- 8. policy_data
CREATE TABLE policy_data (
    id              BIGSERIAL    PRIMARY KEY,
    external_id     VARCHAR(200) NOT NULL,
    source          VARCHAR(30),
    title           VARCHAR(500),
    organization    VARCHAR(200),
    region_code     VARCHAR(10),
    category        VARCHAR(50),
    target          VARCHAR(200),
    content         TEXT,
    support_amount  VARCHAR(100),
    apply_start     DATE,
    apply_end       DATE,
    source_url      VARCHAR(1000),
    raw_data        JSONB,
    normalized_data JSONB,
    confidence      DECIMAL(5,2),
    data            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    fetched_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    CONSTRAINT uk_policy_data_external_source UNIQUE (external_id, source)
);
CREATE INDEX idx_policy_data_source     ON policy_data(source);
CREATE INDEX idx_policy_data_category   ON policy_data(category);
CREATE INDEX idx_policy_data_apply_end  ON policy_data(apply_end);
CREATE INDEX idx_policy_data_deleted_at ON policy_data(deleted_at);

-- 9. api_sync_status
CREATE TABLE api_sync_status (
    id                  BIGSERIAL    PRIMARY KEY,
    api_name            VARCHAR(50)  NOT NULL UNIQUE,
    display_name        VARCHAR(100) NOT NULL,
    last_synced         TIMESTAMP,
    sync_status         VARCHAR(20)  DEFAULT 'PENDING',
    last_record_count   INT,
    error_message       TEXT,
    last_health_checked TIMESTAMP,
    is_active           BOOLEAN      DEFAULT true,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP
);
CREATE INDEX idx_api_sync_status ON api_sync_status(sync_status);
CREATE INDEX idx_api_sync_active ON api_sync_status(is_active);

-- 10. download_history
CREATE TABLE download_history (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    type        VARCHAR(20) NOT NULL,
    format      VARCHAR(10) NOT NULL,
    start_date  DATE,
    end_date    DATE,
    town        VARCHAR(50),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_download_history_user_id ON download_history(user_id);

-- 11. balance_data
CREATE TABLE balance_data (
    id               BIGSERIAL    PRIMARY KEY,
    region_code      VARCHAR(20)  NOT NULL,
    crop_id          BIGINT       NOT NULL REFERENCES crops(id),
    year             INT          NOT NULL,
    season           VARCHAR(10)  NOT NULL,
    supply_forecast  DECIMAL(12,2),
    demand_forecast  DECIMAL(12,2),
    supply_ratio     DECIMAL(5,2),
    balance_status   VARCHAR(20),
    calculated_at    TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    UNIQUE (region_code, crop_id, year, season)
);
CREATE INDEX idx_balance_crop_id ON balance_data(crop_id);
CREATE INDEX idx_balance_region ON balance_data(region_code);

-- 12. 농사로 테이블들
CREATE TABLE nongsaro_varieties (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    variety_name    TEXT,
    crop_name       VARCHAR(100),
    category_code   VARCHAR(20),
    characteristics TEXT,
    breeding_inst   TEXT,
    breeding_year   VARCHAR(10),
    image_url       TEXT,
    attachment_url  TEXT,
    file_name       VARCHAR(200),
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE TABLE nongsaro_farm_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    cntnts_no           VARCHAR(20) NOT NULL,
    crop_code           VARCHAR(20),
    crop_name           VARCHAR(50),
    farm_work_type      TEXT,
    info_type_code      VARCHAR(20),
    info_type_name      TEXT,
    operation_name      TEXT,
    start_month         INT,
    start_period        VARCHAR(10),
    end_month           INT,
    end_period          VARCHAR(10),
    duration_months     INT,
    video_url           TEXT,
    raw_data            JSONB,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP,
    UNIQUE (cntnts_no, operation_name, start_month)
);
CREATE INDEX idx_farm_schedules_crop ON nongsaro_farm_schedules(crop_code);
CREATE INDEX idx_farm_schedules_month ON nongsaro_farm_schedules(start_month);

CREATE TABLE nongsaro_disaster_prevention (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           TEXT,
    crop_name       VARCHAR(100),
    disaster_type   VARCHAR(100),
    content         TEXT,
    image_url       TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE TABLE nongsaro_eco_farming (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           TEXT,
    region_name     VARCHAR(50),
    link_url        TEXT,
    file_name       VARCHAR(200),
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE TABLE nongsaro_advanced_tech (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           TEXT,
    content         TEXT,
    image_url       TEXT,
    video_url       TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
