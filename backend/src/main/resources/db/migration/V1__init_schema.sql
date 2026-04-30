-- =============================================
-- FarmBalance INIT Schema
-- ERD 기반 25개 테이블 생성 (PostgreSQL 16)
-- 생성일: 2026-04-27
-- =============================================

-- ===== 1. 유저 도메인 =====

-- 2.1 users
CREATE TABLE users (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255),
    name        VARCHAR(50)  NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',   -- USER | FARMER | ADMIN | GOV
    region      VARCHAR(50),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE | SUSPENDED
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP
);

-- 2.2 user_social_accounts
CREATE TABLE user_social_accounts (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    provider    VARCHAR(20)  NOT NULL,   -- KAKAO, GOOGLE
    provider_id VARCHAR(100) NOT NULL,
    linked_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);

-- 2.2 farms
CREATE TABLE farms (
    id                    BIGSERIAL    PRIMARY KEY,
    user_id               BIGINT       NOT NULL REFERENCES users(id),
    name                  VARCHAR(100) NOT NULL,
    address               VARCHAR(255) NOT NULL,
    bjd_code              VARCHAR(10),                       -- 법정동코드 (카카오 address.b_code)
    pnu_code              VARCHAR(19),                       -- 필지코드 (bjd_code + 본번부번 조합)
    latitude              DECIMAL(10,7),                     -- 위도 (카카오 address.y)
    longitude             DECIMAL(10,7),                     -- 경도 (카카오 address.x)
    area                  DOUBLE PRECISION NOT NULL,         -- 면적 (㎡)
    soil_type             VARCHAR(50),
    registration_number   VARCHAR(12),                       -- 사업자 등록번호
    document_url          VARCHAR(500),                      -- 토지증명서 이미지/PDF URL
    land_cert_verified    BOOLEAN      DEFAULT false,        -- 관리자 토지증명서 검증 완료 여부
    certification_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    deleted_at            TIMESTAMP
);

-- ===== 2. 작물 도메인 =====

-- 2.3 crop_categories
CREATE TABLE crop_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,     -- 곡류, 채소, 과일, 특용 등
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 2.4 crops
CREATE TABLE crops (
    id                 BIGSERIAL    PRIMARY KEY,
    category_id        BIGINT       NOT NULL REFERENCES crop_categories(id),
    code               VARCHAR(30)  NOT NULL UNIQUE,   -- ex: RICE_001
    name               VARCHAR(50)  NOT NULL,
    growth_days        INT,                             -- 재배 기간 (일)
    yield_per_sqm      DECIMAL(10,2),                   -- ㎡당 수확량 (kg)
    avg_cost_per_sqm   DECIMAL(10,2),                   -- ㎡당 평균 비용 (원)
    climate_conditions JSONB,                           -- 작물별 적정 재배 환경 조건 (AI 추천용)
    is_active          BOOLEAN      DEFAULT true,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    deleted_at         TIMESTAMP
);

-- 2.5 seed_registrations
CREATE TABLE seed_registrations (
    id                 BIGSERIAL    PRIMARY KEY,
    farm_id            BIGINT       NOT NULL REFERENCES farms(id),
    crop_id            BIGINT       NOT NULL REFERENCES crops(id),
    seed_type          VARCHAR(20)  NOT NULL,           -- SEED | SEEDLING | SAPLING
    quantity           INT          NOT NULL,
    estimated_yield    DECIMAL(12,2),                   -- 예상 총 수확량
    yield_unit         VARCHAR(10),                     -- g | kg | ton
    receipt_image_url  VARCHAR(500),                    -- 영수증 사진 URL
    verified           BOOLEAN      DEFAULT false,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    deleted_at         TIMESTAMP
);

-- ===== 3. 수급 도메인 =====

-- 2.6 balance_data
CREATE TABLE balance_data (
    id               BIGSERIAL    PRIMARY KEY,
    region_code      VARCHAR(20)  NOT NULL,
    crop_id          BIGINT       NOT NULL REFERENCES crops(id),
    year             INT          NOT NULL,
    season           VARCHAR(10)  NOT NULL,             -- SPRING | SUMMER | AUTUMN | WINTER
    supply_forecast  DECIMAL(12,2),
    demand_forecast  DECIMAL(12,2),
    supply_ratio     DECIMAL(5,2),                      -- 수급 비율 (%)
    balance_status   VARCHAR(20),                       -- EXCESS_WARN | EXCESS_CAUTION | BALANCED | SHORT_CAUTION | SHORT_WARN
    calculated_at    TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    UNIQUE (region_code, crop_id, year, season)
);

-- ===== 4. 상점 도메인 =====

-- 2.7 product_categories
CREATE TABLE product_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,     -- 채소, 과일, 곡물, 가공식품 등
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 2.8 products
CREATE TABLE products (
    id           BIGSERIAL    PRIMARY KEY,
    seller_id    BIGINT       NOT NULL REFERENCES users(id),
    category_id  BIGINT       REFERENCES product_categories(id),
    name         VARCHAR(200) NOT NULL,
    price        INT NOT NULL,
    stock        INT          NOT NULL DEFAULT 0,
    description  TEXT,
    image_url    VARCHAR(500),
    status       VARCHAR(20)  DEFAULT 'PENDING',    -- PENDING | ACTIVE | INACTIVE | REJECTED
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    deleted_at   TIMESTAMP
);

-- 2.9 orders
CREATE TABLE orders (
    id                BIGSERIAL    PRIMARY KEY,
    buyer_id          BIGINT       NOT NULL REFERENCES users(id),
    order_number      VARCHAR(30)  NOT NULL UNIQUE,
    total_amount      INT NOT NULL,
    status            VARCHAR(20)  DEFAULT 'ORDERED',  -- ORDERED | ACCEPTED | SHIPPED | COMPLETED | CANCELLED
    receiver_name     VARCHAR(50),
    receiver_phone    VARCHAR(20),
    shipping_address  VARCHAR(255),
    shipping_memo     VARCHAR(200),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    deleted_at        TIMESTAMP
);

-- 2.10 order_items
CREATE TABLE order_items (
    id          BIGSERIAL    PRIMARY KEY,
    order_id    BIGINT       NOT NULL REFERENCES orders(id),
    product_id  BIGINT       NOT NULL REFERENCES products(id),
    quantity    INT          NOT NULL,
    unit_price  INT NOT NULL,
    subtotal    INT NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP
);

-- 2.11 cart_items
CREATE TABLE cart_items (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    product_id  BIGINT       NOT NULL REFERENCES products(id),
    quantity    INT          NOT NULL DEFAULT 1,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    UNIQUE (user_id, product_id)
);

-- ===== 5. 커뮤니티 도메인 =====

-- 2.12 post_categories
CREATE TABLE post_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,     -- 자유게시판, 정보공유, Q&A 등
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 2.13 posts
CREATE TABLE posts (
    id           BIGSERIAL    PRIMARY KEY,
    author_id    BIGINT       NOT NULL REFERENCES users(id),
    category_id  BIGINT       NOT NULL REFERENCES post_categories(id),
    title        VARCHAR(200) NOT NULL,
    content      TEXT         NOT NULL,
    view_count   INT          DEFAULT 0,
    is_notice    BOOLEAN      DEFAULT false,
    deleted_at   TIMESTAMP,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP
);

-- 2.14 comments
CREATE TABLE comments (
    id         BIGSERIAL    PRIMARY KEY,
    post_id    BIGINT       NOT NULL REFERENCES posts(id),
    author_id  BIGINT       NOT NULL REFERENCES users(id),
    content    TEXT         NOT NULL,
    accepted   BOOLEAN      DEFAULT false,    -- 답변 채택 여부 (Q&A)
    deleted_at TIMESTAMP,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- ===== 6. 정책 도메인 =====

-- 2.15 policy_data
CREATE TABLE policy_data (
    id           BIGSERIAL    PRIMARY KEY,
    external_id  VARCHAR(200) NOT NULL UNIQUE,     -- 외부 API 제공 정책 고유번호
    data         JSONB        NOT NULL,             -- 정책 API 응답 원본 JSON
    fetched_at   TIMESTAMP    NOT NULL,             -- 수집 시각
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    deleted_at   TIMESTAMP
);

-- ===== 7. 알림 도메인 =====

-- 2.16 guide_messages
CREATE TABLE guide_messages (
    id            BIGSERIAL    PRIMARY KEY,
    sender_id     BIGINT       NOT NULL REFERENCES users(id),  -- 발송자 (관리자/지자체)
    target_type   VARCHAR(10)  NOT NULL,             -- ALL | REGION | CROP | USER
    target_value  VARCHAR(50),                       -- 대상 값 (지역코드, 작물코드 등)
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    channel       VARCHAR(10)  NOT NULL,             -- IN_APP | SMS | EMAIL
    sent_at       TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);

-- 2.17 notifications
CREATE TABLE notifications (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id),
    type       VARCHAR(20)  NOT NULL,               -- BALANCE_WARN | GUIDE | ORDER | POLICY | SYSTEM
    title      VARCHAR(200) NOT NULL,
    message    TEXT,
    link       VARCHAR(500),
    is_read    BOOLEAN      DEFAULT false,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ===== 8. 외부 API 데이터 (독립 테이블, FK 없음) =====

-- 2.18 weather_data (기상청 ASOS 일별 관측)
CREATE TABLE weather_data (
    id              BIGSERIAL    PRIMARY KEY,
    stn_id          VARCHAR(10)  NOT NULL,           -- 관측소 ID (ASOS stnId)
    stn_name        VARCHAR(20),                     -- 관측소명 (ASOS stnNm, 예: "양평")
    obs_date        DATE         NOT NULL,           -- 관측일
    avg_temp        DECIMAL(5,1),                    -- 평균기온(℃)
    min_temp        DECIMAL(5,1),                    -- 최저기온
    max_temp        DECIMAL(5,1),                    -- 최고기온
    total_rain      DECIMAL(7,1),                    -- 일강수량(mm)
    avg_humidity    DECIMAL(5,1),                    -- 평균습도(%)
    sunshine_hours  DECIMAL(5,1),                    -- 일조시간(hr)
    avg_wind_speed  DECIMAL(5,1),                    -- 평균풍속(m/s)
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    UNIQUE (stn_id, obs_date)
);

-- 2.19 soil_exam_data (흙토람 필지별 토양 화학성)
CREATE TABLE soil_exam_data (
    id               BIGSERIAL    PRIMARY KEY,
    pnu_code         VARCHAR(19)  NOT NULL,          -- 필지코드 (흙토람 PNU_CD)
    addr_name        VARCHAR(100),                   -- 주소명 (흙토람 ADDR_NM)
    exam_year        INT          NOT NULL,          -- 검정연도
    exam_date        DATE,                           -- 검정일자 (흙토람 EXAM_DT)
    ph               DECIMAL(4,2),                   -- 산도
    organic_matter   DECIMAL(6,2),                   -- 유기물(g/kg)
    avail_phosphate  DECIMAL(8,2),                   -- 유효인산(mg/kg)
    avail_silica     DECIMAL(8,2),                   -- 유효규산(mg/kg)
    potassium        DECIMAL(6,3),                   -- 치환성 칼륨(cmolc/kg)
    calcium          DECIMAL(6,3),                   -- 치환성 칼슘
    magnesium        DECIMAL(6,3),                   -- 치환성 마그네슘
    ec               DECIMAL(6,3),                   -- 전기전도도(dS/m)
    data_source      VARCHAR(20)  NOT NULL,          -- PARCEL | STAT_FALLBACK | DEFAULT
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    UNIQUE (pnu_code, exam_year)
);

-- 2.20 crop_production_stats (KOSIS 작물별 생산량)
CREATE TABLE crop_production_stats (
    id               BIGSERIAL     PRIMARY KEY,
    itm_nm           VARCHAR(50)   NOT NULL,         -- 작물명 (KOSIS ITM_NM 파싱, 예: "양파")
    region_code      VARCHAR(10)   NOT NULL,         -- 시도코드 (KOSIS C1, 예: "31")
    region_name      VARCHAR(20),                    -- 시도명 (KOSIS C1_NM, 예: "경기도")
    year             INT           NOT NULL,         -- 통계 연도 (KOSIS PRD_DE)
    cultivated_area  DECIMAL(12,2),                  -- 재배면적(ha)
    yield_per_10a    DECIMAL(10,2),                  -- 10a당 생산량(kg)
    total_production DECIMAL(14,2),                  -- 총 생산량(톤)
    unit_nm          VARCHAR(10),                    -- 단위 (KOSIS UNIT_NM)
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    UNIQUE (itm_nm, region_code, year)
);

-- 2.21 soil_fitness_data (흙토람 작물별 토양적성)
CREATE TABLE soil_fitness_data (
    id              BIGSERIAL    PRIMARY KEY,
    soil_crop_cd    VARCHAR(10)  NOT NULL,           -- 작물코드 (흙토람 soil_Crop_Cd, 예: "CR048")
    soil_crop_nm    VARCHAR(50)  NOT NULL,           -- 작물명 (흙토람 soil_Crop_Nm, 예: "양파")
    bjd_code        VARCHAR(10)  NOT NULL,           -- 법정동코드 (흙토람 stdg_Cd)
    bjd_name        VARCHAR(50),                     -- 법정동명 (흙토람 bjd_Nm, 예: "경기도 양평군")
    data_year       INT,                             -- 데이터 기준연도
    high_suit_area  DECIMAL(10,2),                   -- 최적지 면적 (흙토람 high_Suit_Area)
    suit_area       DECIMAL(10,2),                   -- 적지 면적 (흙토람 suit_Area)
    poss_area       DECIMAL(10,2),                   -- 가능지 면적 (흙토람 poss_Area)
    low_suit_area   DECIMAL(10,2),                   -- 저위생산지 면적 (흙토람 low_Suit_Area)
    etc_area        DECIMAL(10,2),                   -- 기타 면적 (흙토람 etc_Area)
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    UNIQUE (soil_crop_cd, bjd_code, data_year)
);

-- 2.22 crop_guides (농사로 재배 길잡이)
CREATE TABLE crop_guides (
    id                  BIGSERIAL    PRIMARY KEY,
    sub_category_code   VARCHAR(20)  NOT NULL,       -- 작물코드 (농사로 subCategoryCode, 예: "VC041201")
    sub_category_nm     VARCHAR(50)  NOT NULL,       -- 작물명 (농사로 subCategoryNm, 예: "양파")
    ebook_code          VARCHAR(10),                 -- 길잡이 코드
    ebook_name          VARCHAR(100),                -- 길잡이명
    ebook_pdf_url       VARCHAR(500),                -- PDF 다운로드 URL
    ebook_img_url       VARCHAR(500),                -- 표지 이미지 URL
    index_data          JSONB,                       -- 목차 (장/절 구조)
    variety_count       INT,                         -- 등록 품종 수
    variety_data        JSONB,                       -- 주요 품종 정보
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP,
    UNIQUE (sub_category_code)
);

-- 2.23 pest_occurrence_reports (병해충 발생정보 보고서)
CREATE TABLE pest_occurrence_reports (
    id            BIGSERIAL    PRIMARY KEY,
    cntnts_no     VARCHAR(20)  NOT NULL UNIQUE,      -- 콘텐츠 번호 (API 응답)
    title         VARCHAR(200) NOT NULL,              -- 보고서 제목
    report_year   INT          NOT NULL,              -- 연도
    pdf_url       VARCHAR(500),                       -- PDF 다운로드 URL
    file_name     VARCHAR(200),                       -- 원본 파일명
    published_at  DATE,                               -- 등록일
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);

-- ===== 9. RAG 도메인 =====

-- 2.24 rag_categories
CREATE TABLE rag_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,     -- 정책, 병해충, 재배기술, 매뉴얼 등
    description    VARCHAR(200),
    display_order  INT          DEFAULT 0,
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 2.25 rag_documents
CREATE TABLE rag_documents (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id),
    category_id   BIGINT       NOT NULL REFERENCES rag_categories(id),
    title         VARCHAR(200) NOT NULL,
    content_type  VARCHAR(10)  NOT NULL,              -- FILE | TEXT
    text_content  TEXT,                                -- 텍스트 내용 (content_type=TEXT)
    file_url      VARCHAR(500),                       -- 파일 경로/URL (content_type=FILE)
    file_name     VARCHAR(200),                       -- 원본 파일명
    file_type     VARCHAR(10),                        -- PDF | TXT | MD | DOCX
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DELETED
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);


-- ===== 10. 인덱스 =====

-- 유저/농장
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_bjd_code ON farms(bjd_code);

-- 종자등록
CREATE INDEX idx_seed_reg_farm_id ON seed_registrations(farm_id);
CREATE INDEX idx_seed_reg_crop_id ON seed_registrations(crop_id);

-- 수급
CREATE INDEX idx_balance_crop_id ON balance_data(crop_id);
CREATE INDEX idx_balance_region ON balance_data(region_code);

-- 상점
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- 커뮤니티
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- 알림
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);

-- 외부 API 데이터
CREATE INDEX idx_soil_pnu ON soil_exam_data(pnu_code);
CREATE INDEX idx_pest_reports_year ON pest_occurrence_reports(report_year);

-- RAG
CREATE INDEX idx_rag_docs_category ON rag_documents(category_id);
CREATE INDEX idx_rag_docs_status ON rag_documents(status);
CREATE INDEX idx_rag_docs_content_type ON rag_documents(content_type);
