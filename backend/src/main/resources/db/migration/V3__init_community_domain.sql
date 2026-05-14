-- =============================================
-- V3: 커뮤니티 도메인 (최종 통합 스키마)
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
