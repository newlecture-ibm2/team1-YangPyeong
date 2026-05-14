-- =============================================
-- V8: AI RAG 문서 관리 테이블 추가
-- RagCategoryJpaEntity, RagDocumentJpaEntity와 매핑
-- =============================================

-- ── 2.24 rag_categories ──
CREATE TABLE rag_categories (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,
    description    VARCHAR(200),
    display_order  INTEGER      DEFAULT 0,
    is_active      BOOLEAN      DEFAULT TRUE,
    created_at     TIMESTAMP,
    updated_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- ── 2.25 rag_documents ──
CREATE TABLE rag_documents (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    category_id   BIGINT       NOT NULL REFERENCES rag_categories(id),
    title         VARCHAR(200) NOT NULL,
    content_type  VARCHAR(10)  NOT NULL,                 -- ENUM: TEXT | FILE
    text_content  TEXT,
    file_url      VARCHAR(500),
    file_name     VARCHAR(200),
    file_type     VARCHAR(10),                           -- ENUM: PDF | DOCX | TXT 등
    status        VARCHAR(20)  NOT NULL,                 -- ENUM: ACTIVE | INACTIVE | DELETED
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);

CREATE INDEX idx_rag_docs_category     ON rag_documents (category_id);
CREATE INDEX idx_rag_docs_status       ON rag_documents (status);
CREATE INDEX idx_rag_docs_content_type ON rag_documents (content_type);
