-- ═══════════════════════════════════════════════════════════════
-- V6: 재배 이력(cultivation_history) 테이블 추가
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cultivation_history (
    id           BIGSERIAL    PRIMARY KEY,
    farm_id      BIGINT       NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    history_type VARCHAR(20)  NOT NULL,
    content      TEXT         NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 농장별 이력 조회 성능 최적화
CREATE INDEX IF NOT EXISTS idx_history_farm_id ON cultivation_history(farm_id);
