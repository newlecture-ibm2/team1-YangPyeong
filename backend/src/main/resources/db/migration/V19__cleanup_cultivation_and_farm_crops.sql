-- ═══════════════════════════════════════════════════════════════
-- V19: farm_crops 삭제 및 cultivation_registrations 불필요 컬럼 정리
-- ═══════════════════════════════════════════════════════════════

-- 1. 중복되는 연결 테이블(farm_crops) 삭제 (cultivation_registrations로 단일화)
DROP TABLE IF EXISTS farm_crops;

-- 2. cultivation_registrations 테이블 불필요 컬럼 정리
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cultivation_registrations' AND column_name='cultivation_type') THEN
        ALTER TABLE cultivation_registrations DROP COLUMN cultivation_type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cultivation_registrations' AND column_name='ai_predicted_yield') THEN
        ALTER TABLE cultivation_registrations DROP COLUMN ai_predicted_yield;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cultivation_registrations' AND column_name='verified') THEN
        ALTER TABLE cultivation_registrations DROP COLUMN verified;
    END IF;
END $$;
