-- ============================================================
-- FarmBalance — PostgreSQL 스키마 초기화 스크립트
-- ERD 문서 기반 자동 생성
-- DB: PostgreSQL 16
-- 실행: psql -U <user> -d <database> -f init-schema.sql
-- ============================================================

-- JSONB 사용을 위한 확인 (PostgreSQL 9.4+ 기본 지원)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 테이블 생성 (의존 관계 순서 준수)
-- ============================================================

-- ----------------------------------------------------------
-- 1.1 users (유저)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    name            VARCHAR(50)     NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20)     NOT NULL DEFAULT 'GENERAL',
    region          VARCHAR(50),
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  users IS '유저';
COMMENT ON COLUMN users.role   IS 'GENERAL | FARMER | ADMIN | GOV';
COMMENT ON COLUMN users.status IS 'ACTIVE | SUSPENDED';

-- ----------------------------------------------------------
-- 1.2 farms (농장)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
    id                      BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                 BIGINT          NOT NULL REFERENCES users(id),
    name                    VARCHAR(100)    NOT NULL,
    address                 VARCHAR(255)    NOT NULL,
    area_size               DECIMAL(10,2)   NOT NULL,
    soil_type               VARCHAR(50),
    land_cert_image_url     VARCHAR(500),
    land_cert_verified      BOOLEAN         DEFAULT false,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP,
    deleted_at              TIMESTAMP
);

COMMENT ON TABLE  farms IS '농장';
COMMENT ON COLUMN farms.area_size IS '면적 (㎡)';
COMMENT ON COLUMN farms.status   IS 'PENDING | APPROVED | REJECTED';

-- ----------------------------------------------------------
-- 1.3 crops (작물 마스터)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS crops (
    id                  BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                VARCHAR(30)     NOT NULL UNIQUE,
    name                VARCHAR(50)     NOT NULL,
    category            VARCHAR(20)     NOT NULL,
    growth_days         INT,
    yield_per_sqm       DECIMAL(10,2),
    avg_cost_per_sqm    DECIMAL(10,2),
    is_active           BOOLEAN         DEFAULT true,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP
);

COMMENT ON TABLE  crops IS '작물 마스터';
COMMENT ON COLUMN crops.code     IS '작물 코드 (ex: RICE_001)';
COMMENT ON COLUMN crops.category IS '곡류 | 채소 | 과일 | 특용';

-- ----------------------------------------------------------
-- 1.4 seed_registrations (종자 등록)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS seed_registrations (
    id                  BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farm_id             BIGINT          NOT NULL REFERENCES farms(id),
    crop_id             BIGINT          NOT NULL REFERENCES crops(id),
    seed_type           VARCHAR(20)     NOT NULL,
    quantity            INT             NOT NULL,
    receipt_image_url   VARCHAR(500),
    verified            BOOLEAN         DEFAULT false,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP
);

COMMENT ON TABLE  seed_registrations IS '종자 등록';
COMMENT ON COLUMN seed_registrations.seed_type IS 'SEED | SEEDLING | SAPLING';

-- ----------------------------------------------------------
-- 1.5 balance_data (수급 데이터)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS balance_data (
    id                  BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    region_code         VARCHAR(20)     NOT NULL,
    crop_id             BIGINT          NOT NULL REFERENCES crops(id),
    year                INT             NOT NULL,
    season              VARCHAR(10)     NOT NULL,
    supply_forecast     DECIMAL(12,2),
    demand_forecast     DECIMAL(12,2),
    supply_ratio        DECIMAL(5,2),
    balance_status      VARCHAR(20),
    calculated_at       TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP
);

COMMENT ON TABLE  balance_data IS '수급 데이터';
COMMENT ON COLUMN balance_data.season         IS 'SPRING | SUMMER | AUTUMN | WINTER';
COMMENT ON COLUMN balance_data.supply_ratio   IS '공급/수요 비율 (%)';
COMMENT ON COLUMN balance_data.balance_status IS 'EXCESS_WARN | EXCESS_CAUTION | BALANCED | SHORT_CAUTION | SHORT_WARN';

-- 복합 유니크 제약
ALTER TABLE balance_data
    ADD CONSTRAINT uq_balance_data_region_crop_year_season
    UNIQUE (region_code, crop_id, year, season);

-- ----------------------------------------------------------
-- 1.6 products (상품)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id       BIGINT          NOT NULL REFERENCES users(id),
    name            VARCHAR(100)    NOT NULL,
    price           DECIMAL(10,2)   NOT NULL,
    stock           INT             NOT NULL DEFAULT 0,
    description     TEXT,
    image_url       VARCHAR(500),
    status          VARCHAR(20)     DEFAULT 'PENDING',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  products IS '상품';
COMMENT ON COLUMN products.status IS 'PENDING | ACTIVE | INACTIVE | REJECTED';

-- ----------------------------------------------------------
-- 1.7 orders (주문)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                  BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    buyer_id            BIGINT          NOT NULL REFERENCES users(id),
    order_number        VARCHAR(30)     NOT NULL UNIQUE,
    total_amount        DECIMAL(12,2)   NOT NULL,
    status              VARCHAR(20)     DEFAULT 'ORDERED',
    shipping_address    VARCHAR(255),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP
);

COMMENT ON TABLE  orders IS '주문';
COMMENT ON COLUMN orders.status IS 'ORDERED | ACCEPTED | SHIPPED | COMPLETED | CANCELLED';

-- ----------------------------------------------------------
-- 1.8 order_items (주문 항목)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        BIGINT          NOT NULL REFERENCES orders(id),
    product_id      BIGINT          NOT NULL REFERENCES products(id),
    quantity        INT             NOT NULL,
    unit_price      DECIMAL(10,2)   NOT NULL,
    subtotal        DECIMAL(10,2)   NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  order_items IS '주문 항목';
COMMENT ON COLUMN order_items.unit_price IS '단가 (주문 시점 스냅샷)';

-- ----------------------------------------------------------
-- 1.9 cart_items (장바구니)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    product_id      BIGINT          NOT NULL REFERENCES products(id),
    quantity        INT             NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE cart_items IS '장바구니';

-- 복합 유니크 제약
ALTER TABLE cart_items
    ADD CONSTRAINT uq_cart_items_user_product
    UNIQUE (user_id, product_id);

-- ----------------------------------------------------------
-- 1.10 posts (게시글)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id       BIGINT          NOT NULL REFERENCES users(id),
    title           VARCHAR(200)    NOT NULL,
    content         TEXT            NOT NULL,
    category        VARCHAR(10)     NOT NULL,
    view_count      INT             DEFAULT 0,
    is_notice       BOOLEAN         DEFAULT false,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

COMMENT ON TABLE  posts IS '게시글';
COMMENT ON COLUMN posts.category IS 'FREE | INFO | QNA';

-- ----------------------------------------------------------
-- 1.11 comments (댓글)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id         BIGINT          NOT NULL REFERENCES posts(id),
    author_id       BIGINT          NOT NULL REFERENCES users(id),
    content         TEXT            NOT NULL,
    accepted        BOOLEAN         DEFAULT false,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

COMMENT ON TABLE  comments IS '댓글';
COMMENT ON COLUMN comments.accepted IS '답변 채택 여부 (Q&A)';

-- ----------------------------------------------------------
-- 1.12 policy_data (정책 API 데이터 저장소)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_data (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_id     VARCHAR(200)    NOT NULL UNIQUE,
    data            JSONB           NOT NULL,
    fetched_at      TIMESTAMP       NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  policy_data IS '정책 API 데이터 저장소';
COMMENT ON COLUMN policy_data.external_id IS '외부 API 제공 정책 고유번호';
COMMENT ON COLUMN policy_data.data       IS '정책 API 응답 원본 JSON';

-- ----------------------------------------------------------
-- 1.13 rag_documents (RAG 문서 메타데이터)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_documents (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    category        VARCHAR(20)     NOT NULL,
    file_url        VARCHAR(500)    NOT NULL,
    uploaded_by     BIGINT          NOT NULL REFERENCES users(id),
    is_active       BOOLEAN         DEFAULT true,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  rag_documents IS 'RAG 문서 메타데이터';
COMMENT ON COLUMN rag_documents.category IS 'CROP_GUIDE | MARKET | POLICY | WEATHER | ETC';

-- ----------------------------------------------------------
-- 1.14 guide_messages (권고 메시지)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS guide_messages (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id       BIGINT          NOT NULL REFERENCES users(id),
    target_type     VARCHAR(10)     NOT NULL,
    target_value    VARCHAR(50),
    title           VARCHAR(200)    NOT NULL,
    content         TEXT            NOT NULL,
    channel         VARCHAR(10)     NOT NULL,
    sent_at         TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  guide_messages IS '권고 메시지';
COMMENT ON COLUMN guide_messages.target_type IS 'ALL | REGION | CROP | USER';
COMMENT ON COLUMN guide_messages.channel     IS 'IN_APP | SMS | EMAIL';

-- ----------------------------------------------------------
-- 1.15 notifications (알림)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    type            VARCHAR(20)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    message         TEXT,
    link            VARCHAR(500),
    is_read         BOOLEAN         DEFAULT false,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  notifications IS '알림';
COMMENT ON COLUMN notifications.type IS 'BALANCE_WARN | GUIDE | ORDER | POLICY | SYSTEM';


-- ============================================================
-- 2. 인덱스 생성
-- ============================================================

-- 유저 조회
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_region      ON users(region);

-- 농장
CREATE INDEX IF NOT EXISTS idx_farms_user_id     ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_status      ON farms(status);

-- 종자 등록
CREATE INDEX IF NOT EXISTS idx_seed_reg_farm_id  ON seed_registrations(farm_id);
CREATE INDEX IF NOT EXISTS idx_seed_reg_crop_id  ON seed_registrations(crop_id);



-- 수급 데이터 (핵심 조회)
CREATE INDEX IF NOT EXISTS idx_balance_data_status ON balance_data(balance_status);

-- 상품
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status    ON products(status);

-- 주문
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id    ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);

-- 게시글
CREATE INDEX IF NOT EXISTS idx_posts_author_id    ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category     ON posts(category);

-- 알림 (빈번한 조회)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);

-- ============================================================
-- 완료
-- ============================================================
