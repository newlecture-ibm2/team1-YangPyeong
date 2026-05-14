-- =============================================
-- V4: 상점 도메인 (최종 통합 스키마)
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
