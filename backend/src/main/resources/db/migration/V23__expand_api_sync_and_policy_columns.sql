-- =============================================
-- V23: Expand columns for api_sync_status and policy_data
-- To prevent 'value too long' errors from external API data
-- =============================================

-- 1. api_sync_status 컬럼 확장
ALTER TABLE api_sync_status 
    ALTER COLUMN sync_status TYPE VARCHAR(100),
    ALTER COLUMN error_message TYPE TEXT;

-- 2. policy_data 컬럼 확장
ALTER TABLE policy_data
    ALTER COLUMN title TYPE TEXT,
    ALTER COLUMN target TYPE TEXT,
    ALTER COLUMN support_amount TYPE TEXT,
    ALTER COLUMN source_url TYPE TEXT;
