-- 범용 신고 테이블 (커뮤니티, 상점, 유저 등 모든 도메인에서 사용)
CREATE TABLE reports (
    id          BIGSERIAL    PRIMARY KEY,
    target_type VARCHAR(20)  NOT NULL,            -- 'POST', 'COMMENT', 'PRODUCT', 'USER' 등
    target_id   BIGINT       NOT NULL,            -- 대상 레코드의 ID
    reporter_id BIGINT       NOT NULL REFERENCES users(id),
    reason      VARCHAR(500) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING | RESOLVED | DISMISSED
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (target_type, target_id, reporter_id)  -- 동일 대상 중복 신고 방지
);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);
