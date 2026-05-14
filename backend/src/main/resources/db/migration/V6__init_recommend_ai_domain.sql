-- =============================================
-- V6: AI 추천 & 그래프 & RAG 도메인 (최종 통합 스키마)
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
