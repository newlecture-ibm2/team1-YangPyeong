-- ═══════════════════════════════════════════════════════════════
-- V17: API 데이터 연동 상태 관리 테이블 생성
-- 관리자(admin)가 외부 API 데이터 수집 상태를 모니터링하고 제어하기 위한 용도입니다.
-- ═══════════════════════════════════════════════════════════════

-- 1. api_sync_status (API 동기화 모니터링 및 상태 제어)
CREATE TABLE IF NOT EXISTS api_sync_status (
    id                  BIGSERIAL    PRIMARY KEY,
    api_name            VARCHAR(50)  NOT NULL UNIQUE,
    display_name        VARCHAR(100) NOT NULL,
    
    last_synced         TIMESTAMP,
    sync_status         VARCHAR(20)  DEFAULT 'PENDING', -- PENDING, RUNNING, SUCCESS, FAILED
    last_record_count   INT,
    error_message       TEXT,
    
    is_active           BOOLEAN      DEFAULT true, -- 관리자가 특정 API 수집을 끄고 켤 수 있는 스위치
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_api_sync_status ON api_sync_status(sync_status);
CREATE INDEX IF NOT EXISTS idx_api_sync_active ON api_sync_status(is_active);
