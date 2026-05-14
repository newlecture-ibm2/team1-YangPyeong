-- =============================================
-- V5: batch_logs 테이블에 소요 시간(duration_ms) 컬럼 추가
-- =============================================
ALTER TABLE batch_logs ADD COLUMN duration_ms BIGINT;
