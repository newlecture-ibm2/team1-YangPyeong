-- =============================================
-- V1: ?좎? ?꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
-- users, user_social_accounts, security_questions, user_sanction_logs
-- =============================================

-- 1. users
CREATE TABLE users (
    id                      BIGSERIAL    PRIMARY KEY,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    password                VARCHAR(255),
    name                    VARCHAR(50)  NOT NULL,
    phone                   VARCHAR(20),
    role                    VARCHAR(20)  NOT NULL DEFAULT 'USER',
    status                  VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    provider                VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    provider_id             VARCHAR(100),
    profile_image_url       VARCHAR(200),
    address                 VARCHAR(255),
    bio                     TEXT,
    withdrawal_requested_at TIMESTAMP,
    anonymized_at           TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP
);

-- 2. user_social_accounts
CREATE TABLE user_social_accounts (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    provider    VARCHAR(20)  NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    linked_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);
CREATE INDEX idx_user_social_accounts_user_id ON user_social_accounts(user_id);

-- 3. security_questions
CREATE TABLE security_questions (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL UNIQUE REFERENCES users(id),
    question    VARCHAR(200) NOT NULL,
    answer      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);
CREATE INDEX idx_security_questions_user_id ON security_questions(user_id);

-- 4. user_sanction_logs
CREATE TABLE user_sanction_logs (
    id              BIGSERIAL PRIMARY KEY,
    target_user_id  BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type     VARCHAR(50) NOT NULL,
    reason_type     VARCHAR(50) NOT NULL,
    reason_detail   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_sanction_logs_target_user_id ON user_sanction_logs(target_user_id);
-- =============================================
-- V2: ?띿옣 & ?묐Ъ & ?щ같 ?꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
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

-- 4. cultivation_registrations (援?seed_registrations)
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
-- =============================================
-- V3: 而ㅻ??덊떚 ?꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
-- post_categories, posts, comments, chat_rooms, chat_messages
-- =============================================

-- 1. post_categories
CREATE TABLE post_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 2. posts
CREATE TABLE posts (
    id           BIGSERIAL    PRIMARY KEY,
    author_id    BIGINT       NOT NULL REFERENCES users(id),
    category_id  BIGINT       NOT NULL REFERENCES post_categories(id),
    title        VARCHAR(200) NOT NULL,
    content      TEXT         NOT NULL,
    view_count   INT          DEFAULT 0,
    is_notice    BOOLEAN      DEFAULT false,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    deleted_at   TIMESTAMP
);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);

-- 3. comments
CREATE TABLE comments (
    id         BIGSERIAL    PRIMARY KEY,
    post_id    BIGINT       NOT NULL REFERENCES posts(id),
    author_id  BIGINT       NOT NULL REFERENCES users(id),
    content    TEXT         NOT NULL,
    accepted   BOOLEAN      DEFAULT false,
    parent_id  BIGINT,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- 4. chat_rooms
CREATE TABLE chat_rooms (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. chat_messages
CREATE TABLE chat_messages (
    id            BIGSERIAL PRIMARY KEY,
    chat_room_id  BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_role   VARCHAR(20) NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
-- =============================================
-- V4: ?곸젏 ?꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
-- product_categories, products, orders, order_items, cart_items, uploads
-- =============================================

-- 1. product_categories
CREATE TABLE product_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 2. products
CREATE TABLE products (
    id                BIGSERIAL    PRIMARY KEY,
    seller_id         BIGINT       NOT NULL REFERENCES users(id),
    category_id       BIGINT       REFERENCES product_categories(id),
    name              VARCHAR(200) NOT NULL,
    price             INT          NOT NULL,
    stock             INT          NOT NULL DEFAULT 0,
    description       TEXT,
    sales_count       INT          NOT NULL DEFAULT 0,
    harvest_record_id BIGINT       REFERENCES harvest_records(id),
    status            VARCHAR(20)  DEFAULT 'PENDING',
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    deleted_at        TIMESTAMP
);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_harvest_id ON products(harvest_record_id);

-- 3. orders
CREATE TABLE orders (
    id                BIGSERIAL    PRIMARY KEY,
    buyer_id          BIGINT       NOT NULL REFERENCES users(id),
    order_number      VARCHAR(30)  NOT NULL UNIQUE,
    total_amount      INT          NOT NULL,
    status            VARCHAR(20)  DEFAULT 'ORDERED',
    receiver_name     VARCHAR(50),
    receiver_phone    VARCHAR(20),
    shipping_address  VARCHAR(255),
    shipping_memo     VARCHAR(200),
    tracking_number   VARCHAR(30),
    shipped_at        TIMESTAMP,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    deleted_at        TIMESTAMP
);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);

-- 4. order_items
CREATE TABLE order_items (
    id          BIGSERIAL    PRIMARY KEY,
    order_id    BIGINT       NOT NULL REFERENCES orders(id),
    product_id  BIGINT       NOT NULL REFERENCES products(id),
    quantity    INT          NOT NULL,
    unit_price  INT          NOT NULL,
    subtotal    INT          NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 5. cart_items
CREATE TABLE cart_items (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    product_id  BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INT          NOT NULL DEFAULT 1,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    UNIQUE (user_id, product_id)
);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- 6. uploads
CREATE TABLE uploads (
    id             BIGSERIAL    PRIMARY KEY,
    entity_type    VARCHAR(30)  NOT NULL,
    entity_id      BIGINT       NOT NULL,
    file_type      VARCHAR(20)  NOT NULL DEFAULT 'IMAGE',
    file_url       VARCHAR(500) NOT NULL,
    original_name  VARCHAR(255),
    display_order  INT          DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMP
);
CREATE INDEX idx_uploads_entity ON uploads(entity_type, entity_id);
-- =============================================
-- V5: 怨듦났 API & ?몃? ?곗씠???꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
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

-- 12. ?띿궗濡??뚯씠釉붾뱾
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
-- =============================================
-- V6: AI 異붿쿇 & 洹몃옒??& RAG ?꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
-- recommend_history, recommend_history_item,
-- rag_categories, rag_documents,
-- graph schema (graph_entity, graph_relation)
-- =============================================

-- 1. recommend_history
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
CREATE INDEX idx_recommend_history_farm_generated ON recommend_history(farm_id, generated_at DESC);

-- 2. recommend_history_item
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

-- 3. rag_categories
CREATE TABLE rag_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 4. rag_documents
CREATE TABLE rag_documents (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id),
    category_id   BIGINT       NOT NULL REFERENCES rag_categories(id),
    title         VARCHAR(200) NOT NULL,
    content_type  VARCHAR(10)  NOT NULL,
    text_content  TEXT,
    file_url      VARCHAR(500),
    file_name     VARCHAR(200),
    file_type     VARCHAR(10),
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);
CREATE INDEX idx_rag_docs_category ON rag_documents(category_id);
CREATE INDEX idx_rag_docs_status ON rag_documents(status);
CREATE INDEX idx_rag_docs_content_type ON rag_documents(content_type);

-- 5. graph schema
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
CREATE INDEX idx_graph_entity_type ON graph.graph_entity(entity_type);
CREATE INDEX idx_graph_entity_type_key ON graph.graph_entity(entity_type, entity_key);

CREATE TABLE graph.graph_relation (
    id BIGSERIAL PRIMARY KEY,
    relation_type VARCHAR(50) NOT NULL,
    from_entity_id BIGINT NOT NULL,
    to_entity_id BIGINT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_relation UNIQUE (relation_type, from_entity_id, to_entity_id)
);
CREATE INDEX idx_graph_relation_type ON graph.graph_relation(relation_type);
CREATE INDEX idx_graph_relation_from ON graph.graph_relation(from_entity_id);
CREATE INDEX idx_graph_relation_to ON graph.graph_relation(to_entity_id);
-- =============================================
-- V7: ?쒖뒪??怨듯넻 ?꾨찓??(理쒖쥌 ?듯빀 ?ㅽ궎留?
-- guide_messages, notifications, fcm_tokens,
-- reports, batch_logs
-- =============================================

-- 1. guide_messages
CREATE TABLE guide_messages (
    id            BIGSERIAL    PRIMARY KEY,
    sender_id     BIGINT       NOT NULL REFERENCES users(id),
    target_type   VARCHAR(10)  NOT NULL,
    target_value  VARCHAR(50),
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    channel       VARCHAR(10)  NOT NULL,
    sent_at       TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);

-- 2. notifications
CREATE TABLE notifications (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id),
    type       VARCHAR(20)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT,
    link       VARCHAR(500),
    is_read    BOOLEAN      DEFAULT false,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);

-- 3. fcm_tokens
CREATE TABLE fcm_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    token       VARCHAR(500) NOT NULL,
    device_type VARCHAR(20)  DEFAULT 'WEB',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    UNIQUE (user_id, token)
);
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- 4. reports (踰붿슜 ?좉퀬)
CREATE TABLE reports (
    id          BIGSERIAL    PRIMARY KEY,
    target_type VARCHAR(20)  NOT NULL,
    target_id   BIGINT       NOT NULL,
    reporter_id BIGINT       NOT NULL REFERENCES users(id),
    reason      VARCHAR(500) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (target_type, target_id, reporter_id)
);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);

-- 5. batch_logs
CREATE TABLE batch_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_processed INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    messages TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_batch_logs_job_name ON batch_logs(job_name);
CREATE INDEX idx_batch_logs_created_at ON batch_logs(created_at DESC);
