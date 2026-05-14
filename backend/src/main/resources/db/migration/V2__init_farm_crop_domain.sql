-- =============================================
-- V2: 농장 & 작물 & 재배 도메인 (최종 통합 스키마)
-- crop_categories, crops, farms, cultivation_registrations,
-- cultivation_history, harvest_records, crop_cultivation_env, crop_price_cache
-- =============================================

-- 1. crop_categories
CREATE TABLE crop_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    external_id    VARCHAR(50),
    data_source    VARCHAR(20)  DEFAULT 'MANUAL',
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);
CREATE INDEX idx_crop_categories_external_id ON crop_categories(external_id);

-- 2. crops
CREATE TABLE crops (
    id                 BIGSERIAL    PRIMARY KEY,
    category_id        BIGINT       NOT NULL REFERENCES crop_categories(id),
    code               VARCHAR(30)  NOT NULL UNIQUE,
    name               VARCHAR(50)  NOT NULL,
    growth_days        INT,
    yield_per_sqm      DECIMAL(10,2),
    avg_cost_per_sqm   DECIMAL(10,2),
    climate_conditions JSONB,
    is_active          BOOLEAN      DEFAULT true,
    external_id        VARCHAR(50),
    data_source        VARCHAR(20)  DEFAULT 'MANUAL',
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    deleted_at         TIMESTAMP
);
CREATE INDEX idx_crops_external_id ON crops(external_id);

-- 3. farms
CREATE TABLE farms (
    id                    BIGSERIAL    PRIMARY KEY,
    user_id               BIGINT       NOT NULL REFERENCES users(id),
    name                  VARCHAR(100) NOT NULL,
    address               VARCHAR(255) NOT NULL,
    bjd_code              VARCHAR(10),
    pnu_code              VARCHAR(19),
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    area                  DOUBLE PRECISION,
    soil_type             VARCHAR(50),
    soil_ph               DOUBLE PRECISION,
    soil_organic_matter   DOUBLE PRECISION,
    documents             JSONB,
    document_data         JSONB,
    certification_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reject_reason         VARCHAR(500),
    status                VARCHAR(20)  NOT NULL DEFAULT 'OPERATING',
    soil_exam_synced_at         TIMESTAMP,
    soil_exam_last_attempt_at   TIMESTAMP,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    deleted_at            TIMESTAMP
);
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_bjd_code ON farms(bjd_code);

-- 4. cultivation_registrations (구 seed_registrations)
CREATE TABLE cultivation_registrations (
    id                      BIGSERIAL    PRIMARY KEY,
    farm_id                 BIGINT       NOT NULL REFERENCES farms(id),
    crop_id                 BIGINT       NOT NULL REFERENCES crops(id),
    cultivation_area        DECIMAL(10,2),
    farmer_estimated_yield  DECIMAL(12,2),
    yield_unit              VARCHAR(10),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP,
    deleted_at              TIMESTAMP
);
CREATE INDEX idx_cultivation_reg_farm_id ON cultivation_registrations(farm_id);
CREATE INDEX idx_cultivation_reg_crop_id ON cultivation_registrations(crop_id);

-- 5. cultivation_history
CREATE TABLE cultivation_history (
    id                          BIGSERIAL    PRIMARY KEY,
    farm_id                     BIGINT       NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    cultivation_registration_id BIGINT       REFERENCES cultivation_registrations(id) ON DELETE CASCADE,
    record_date                 DATE         NOT NULL DEFAULT CURRENT_DATE,
    activity_type               VARCHAR(20),
    activity_content            TEXT,
    avg_temp                    DECIMAL(5,1),
    total_rain                  DECIMAL(7,1),
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_history_cult_reg ON cultivation_history(cultivation_registration_id);

-- 6. harvest_records
CREATE TABLE harvest_records (
    id                          BIGSERIAL    PRIMARY KEY,
    cultivation_registration_id BIGINT       NOT NULL REFERENCES cultivation_registrations(id) ON DELETE CASCADE,
    harvest_date                DATE         NOT NULL,
    yield_amount                DECIMAL(12,2) NOT NULL,
    yield_unit                  VARCHAR(10)  NOT NULL,
    grade                       VARCHAR(10),
    to_shop                     BOOLEAN      DEFAULT false,
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_harvest_cult_reg ON harvest_records(cultivation_registration_id);

-- 7. crop_cultivation_env
CREATE TABLE crop_cultivation_env (
    id              BIGSERIAL    PRIMARY KEY,
    crop_name       VARCHAR(50)  NOT NULL UNIQUE,
    optimal_ph_min  DECIMAL(3,1),
    optimal_ph_max  DECIMAL(3,1),
    optimal_temp    VARCHAR(30),
    organic_matter  DECIMAL(5,1),
    soil_types      TEXT,
    difficulty      INT,
    sowing_info     VARCHAR(50),
    harvest_info    VARCHAR(50),
    growth_days     INT,
    major_pests     VARCHAR(512),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
CREATE INDEX idx_crop_cultivation_env_name ON crop_cultivation_env(crop_name);

-- 8. crop_price_cache
CREATE TABLE crop_price_cache (
    id              BIGSERIAL    PRIMARY KEY,
    crop_name       VARCHAR(50)  NOT NULL,
    price           INT          NOT NULL,
    unit            VARCHAR(20)  NOT NULL,
    price_date      DATE         NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crop_price_cache_name_date ON crop_price_cache(crop_name, price_date);
