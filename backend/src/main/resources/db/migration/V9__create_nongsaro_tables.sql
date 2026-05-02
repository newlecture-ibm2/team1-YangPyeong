-- ═══════════════════════════════════════════════════════════════
-- V6: 농사로 Open API 데이터 저장용 테이블 생성
-- 대상 서비스: varietyInfo, farmWorkingPlanNew, frcDsstrPrevnt,
--             evrfrndFarmng, uptodeFarmngTchnlgyInfo
-- 기존 테이블(crop_guides, pest_occurrence_reports)은 제외
-- ═══════════════════════════════════════════════════════════════

-- 1. 품종 정보 (varietyInfo) — 약 2,604건
CREATE TABLE IF NOT EXISTS nongsaro_varieties (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    variety_name    VARCHAR(200),
    crop_name       VARCHAR(100),
    category_code   VARCHAR(20),
    characteristics TEXT,
    breeding_inst   VARCHAR(200),
    breeding_year   VARCHAR(10),
    image_url       TEXT,
    attachment_url  TEXT,
    file_name       VARCHAR(200),
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 2. 농작업일정 시기별 (farmWorkingPlanNew) — 품목×작업별 다수
CREATE TABLE IF NOT EXISTS nongsaro_farm_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    cntnts_no           VARCHAR(20) NOT NULL,
    crop_code           VARCHAR(20),
    crop_name           VARCHAR(50),
    farm_work_type      VARCHAR(100),
    info_type_code      VARCHAR(20),
    info_type_name      VARCHAR(100),
    operation_name      VARCHAR(200),
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

CREATE INDEX IF NOT EXISTS idx_farm_schedules_crop ON nongsaro_farm_schedules(crop_code);
CREATE INDEX IF NOT EXISTS idx_farm_schedules_month ON nongsaro_farm_schedules(start_month);

-- 3. 재해예방정보 (frcDsstrPrevnt) — 약 320건
CREATE TABLE IF NOT EXISTS nongsaro_disaster_prevention (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(300),
    crop_name       VARCHAR(100),
    disaster_type   VARCHAR(100),
    content         TEXT,
    image_url       TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 4. 친환경 우수사례 (evrfrndFarmng) — 약 66건
CREATE TABLE IF NOT EXISTS nongsaro_eco_farming (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(300),
    region_name     VARCHAR(50),
    link_url        TEXT,
    file_name       VARCHAR(200),
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 5. 첨단농업기술 (uptodeFarmngTchnlgyInfo) — 약 171건
CREATE TABLE IF NOT EXISTS nongsaro_advanced_tech (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(300),
    content         TEXT,
    image_url       TEXT,
    video_url       TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
