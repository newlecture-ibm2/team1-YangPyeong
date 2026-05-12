CREATE TABLE user_sanction_logs (
    id BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    reason_type VARCHAR(50) NOT NULL,
    reason_detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sanction_logs_target_user_id ON user_sanction_logs(target_user_id);
