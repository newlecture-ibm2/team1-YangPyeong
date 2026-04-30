-- =============================================
-- V2: 챗봇 대화방 및 메시지 테이블 추가
-- =============================================

CREATE TABLE chat_rooms (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id            BIGSERIAL PRIMARY KEY,
    chat_room_id  BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_role   VARCHAR(20) NOT NULL, -- 'USER', 'AI', 'SYSTEM'
    content       TEXT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
