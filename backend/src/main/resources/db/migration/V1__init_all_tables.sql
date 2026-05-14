-- =============================================
-- V1: 전체 도메인 테이블 생성 (통합 DDL)
-- =============================================

-- 1. User Domain
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(100),
    profile_image_url VARCHAR(200),
    address VARCHAR(255),
    bio TEXT,
    withdrawal_requested_at TIMESTAMP,
    anonymized_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE user_social_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);

CREATE TABLE security_questions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    question VARCHAR(200) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE user_sanction_logs (
    id BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    reason_type VARCHAR(50) NOT NULL,
    reason_detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Farm & Crop Domain
CREATE TABLE crop_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    external_id VARCHAR(50),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE crops (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES crop_categories(id),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    growth_days INT,
    yield_per_sqm DECIMAL(10,2),
    avg_cost_per_sqm DECIMAL(10,2),
    climate_conditions JSONB,
    is_active BOOLEAN DEFAULT true,
    external_id VARCHAR(50),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE farms (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    bjd_code VARCHAR(10),
    pnu_code VARCHAR(19),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    area DOUBLE PRECISION,
    soil_type VARCHAR(50),
    soil_ph DOUBLE PRECISION,
    soil_organic_matter DOUBLE PRECISION,
    documents JSONB,
    document_data JSONB,
    certification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reject_reason VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'OPERATING',
    soil_exam_synced_at TIMESTAMP,
    soil_exam_last_attempt_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE cultivation_registrations (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id),
    crop_id BIGINT NOT NULL REFERENCES crops(id),
    cultivation_area DECIMAL(10,2),
    farmer_estimated_yield DECIMAL(12,2),
    yield_unit VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE cultivation_history (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    cultivation_registration_id BIGINT REFERENCES cultivation_registrations(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type VARCHAR(20),
    activity_content TEXT,
    avg_temp DECIMAL(5,1),
    total_rain DECIMAL(7,1),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE harvest_records (
    id BIGSERIAL PRIMARY KEY,
    cultivation_registration_id BIGINT NOT NULL REFERENCES cultivation_registrations(id) ON DELETE CASCADE,
    harvest_date DATE NOT NULL,
    yield_amount DECIMAL(12,2) NOT NULL,
    yield_unit VARCHAR(10) NOT NULL,
    grade VARCHAR(10),
    to_shop BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE crop_cultivation_env (
    id BIGSERIAL PRIMARY KEY,
    crop_name VARCHAR(50) NOT NULL UNIQUE,
    optimal_ph_min DECIMAL(3,1),
    optimal_ph_max DECIMAL(3,1),
    optimal_temp VARCHAR(30),
    organic_matter DECIMAL(5,1),
    soil_types TEXT,
    difficulty INT,
    sowing_info VARCHAR(50),
    harvest_info VARCHAR(50),
    growth_days INT,
    major_pests VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE crop_price_cache (
    id BIGSERIAL PRIMARY KEY,
    crop_name VARCHAR(50) NOT NULL,
    price INT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Community Domain
CREATE TABLE post_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id),
    category_id BIGINT NOT NULL REFERENCES post_categories(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    view_count INT DEFAULT 0,
    is_notice BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id),
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    accepted BOOLEAN DEFAULT false,
    parent_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_room_id BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Shop Domain
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id),
    category_id BIGINT REFERENCES product_categories(id),
    name VARCHAR(200) NOT NULL,
    price INT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    description TEXT,
    sales_count INT NOT NULL DEFAULT 0,
    harvest_record_id BIGINT REFERENCES harvest_records(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES users(id),
    order_number VARCHAR(30) NOT NULL UNIQUE,
    total_amount INT NOT NULL,
    status VARCHAR(20) DEFAULT 'ORDERED',
    receiver_name VARCHAR(50),
    receiver_phone VARCHAR(20),
    shipping_address VARCHAR(255),
    shipping_memo VARCHAR(200),
    tracking_number VARCHAR(30),
    shipped_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price INT NOT NULL,
    subtotal INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (user_id, product_id)
);

CREATE TABLE uploads (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT NOT NULL,
    file_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE',
    file_url VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 5. OpenAPI Domain
CREATE TABLE regions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(30) NOT NULL,
    type VARCHAR(10) NOT NULL,
    parent_id BIGINT REFERENCES regions(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE weather_data (
    id BIGSERIAL PRIMARY KEY,
    stn_id VARCHAR(10) NOT NULL,
    stn_name VARCHAR(20),
    obs_date DATE NOT NULL,
    avg_temp DECIMAL(5,1),
    min_temp DECIMAL(5,1),
    max_temp DECIMAL(5,1),
    total_rain DECIMAL(7,1),
    avg_humidity DECIMAL(5,1),
    sunshine_hours DECIMAL(5,1),
    avg_wind_speed DECIMAL(5,1),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (stn_id, obs_date)
);

CREATE TABLE soil_exam_data (
    id BIGSERIAL PRIMARY KEY,
    pnu_code VARCHAR(19) NOT NULL,
    addr_name VARCHAR(100),
    exam_year INT NOT NULL,
    exam_date DATE,
    ph DECIMAL(4,2),
    organic_matter DECIMAL(6,2),
    avail_phosphate DECIMAL(8,2),
    avail_silica DECIMAL(8,2),
    potassium DECIMAL(6,3),
    calcium DECIMAL(6,3),
    magnesium DECIMAL(6,3),
    ec DECIMAL(6,3),
    data_source VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (pnu_code, exam_year)
);

CREATE TABLE crop_production_stats (
    id BIGSERIAL PRIMARY KEY,
    itm_nm VARCHAR(50) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    region_name VARCHAR(20),
    year INT NOT NULL,
    cultivated_area DECIMAL(12,2),
    yield_per_10a DECIMAL(10,2),
    total_production DECIMAL(14,2),
    unit_nm VARCHAR(10),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (itm_nm, region_code, year)
);

CREATE TABLE soil_fitness_data (
    id BIGSERIAL PRIMARY KEY,
    soil_crop_cd VARCHAR(10) NOT NULL,
    soil_crop_nm VARCHAR(50) NOT NULL,
    bjd_code VARCHAR(10) NOT NULL,
    bjd_name VARCHAR(50),
    data_year INT,
    high_suit_area DECIMAL(10,2),
    suit_area DECIMAL(10,2),
    poss_area DECIMAL(10,2),
    low_suit_area DECIMAL(10,2),
    etc_area DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (soil_crop_cd, bjd_code, data_year)
);

CREATE TABLE api_sync_status (
    id BIGSERIAL PRIMARY KEY,
    api_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    last_synced TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    last_record_count INT,
    error_message TEXT,
    last_health_checked TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE balance_data (
    id BIGSERIAL PRIMARY KEY,
    region_code VARCHAR(20) NOT NULL,
    crop_id BIGINT NOT NULL REFERENCES crops(id),
    year INT NOT NULL,
    season VARCHAR(10) NOT NULL,
    supply_forecast DECIMAL(12,2),
    demand_forecast DECIMAL(12,2),
    supply_ratio DECIMAL(5,2),
    balance_status VARCHAR(20),
    calculated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (region_code, crop_id, year, season)
);

CREATE TABLE nongsaro_varieties (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    variety_name TEXT,
    crop_name VARCHAR(100),
    category_code VARCHAR(20),
    characteristics TEXT,
    breeding_inst TEXT,
    breeding_year VARCHAR(10),
    image_url TEXT,
    attachment_url TEXT,
    file_name VARCHAR(200),
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE nongsaro_farm_schedules (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) NOT NULL,
    crop_code VARCHAR(20),
    crop_name VARCHAR(50),
    farm_work_type TEXT,
    info_type_code VARCHAR(20),
    info_type_name TEXT,
    operation_name TEXT,
    start_month INT,
    start_period VARCHAR(10),
    end_month INT,
    end_period VARCHAR(10),
    duration_months INT,
    video_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (cntnts_no, operation_name, start_month)
);

CREATE TABLE pest_occurrence_reports (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title TEXT,
    report_year VARCHAR(10),
    pdf_url TEXT,
    file_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nongsaro_disaster_prevention (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title TEXT,
    disaster_type VARCHAR(50),
    image_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nongsaro_eco_farming (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title TEXT,
    region_name VARCHAR(50),
    link_url TEXT,
    file_name VARCHAR(200),
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nongsaro_advanced_tech (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title TEXT,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crop_guides (
    id BIGSERIAL PRIMARY KEY,
    sub_category_code VARCHAR(20),
    sub_category_nm VARCHAR(100),
    ebook_code VARCHAR(20) UNIQUE NOT NULL,
    ebook_name TEXT,
    ebook_pdf_url TEXT,
    ebook_img_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Recommend AI Domain
CREATE TABLE recommend_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farm_id BIGINT NOT NULL,
    farm_name VARCHAR(255),
    farm_address VARCHAR(255),
    farm_area DOUBLE PRECISION,
    soil_ph DOUBLE PRECISION,
    organic_matter DOUBLE PRECISION,
    soil_type VARCHAR(100),
    w_soil DOUBLE PRECISION,
    w_price DOUBLE PRECISION,
    w_supply DOUBLE PRECISION,
    w_difficulty DOUBLE PRECISION,
    score_includes_climate BOOLEAN,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommend_history_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    history_id BIGINT NOT NULL REFERENCES recommend_history(id) ON DELETE CASCADE,
    crop_id BIGINT,
    crop_name VARCHAR(100),
    category VARCHAR(50),
    "rank" INT,
    score INT,
    soil_fitness VARCHAR(50),
    soil_fitness_percent INT,
    price_forecast_percent INT,
    supply_stability_percent INT,
    supply_status VARCHAR(50),
    expected_revenue_per_kg INT,
    expected_yield INT,
    ai_reason TEXT,
    difficulty INT,
    growth_days INT,
    optimal_temp VARCHAR(100),
    sowing_period VARCHAR(100),
    harvest_period VARCHAR(100),
    pests TEXT,
    kpi_sources_note VARCHAR(1024),
    climate_fitness_percent INT
);

CREATE SCHEMA IF NOT EXISTS graph;

CREATE TABLE graph.graph_entity (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_key VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    source_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_entity UNIQUE (entity_type, entity_key)
);

-- 7. System Domain
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (target_type, target_id, reporter_id)
);

CREATE TABLE batch_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_processed INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    messages TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
