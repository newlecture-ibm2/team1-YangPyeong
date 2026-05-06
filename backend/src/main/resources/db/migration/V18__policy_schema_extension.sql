-- ═══════════════════════════════════════════════════════════════
-- V18: policy_data 테이블 확장 (Gov24 연동 + AI 분석 지원)
--
-- V1에서 생성된 기본 컬럼(id, external_id, data, fetched_at, created/updated/deleted_at)에
-- 정규화 컬럼 + AI 분석 결과 컬럼을 추가합니다.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. 정규화 컬럼 추가 ──
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS source          VARCHAR(30);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS title           VARCHAR(500);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS organization    VARCHAR(200);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS region_code     VARCHAR(10);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS category        VARCHAR(50);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS target          VARCHAR(200);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS content         TEXT;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS support_amount  VARCHAR(100);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS apply_start     DATE;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS apply_end       DATE;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS source_url      VARCHAR(1000);

-- ── 2. API 원본 + AI 분석 결과 ──
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS raw_data        JSONB;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS normalized_data JSONB;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS confidence      DECIMAL(5,2);

-- ── 3. 복합 유니크 제약 (external_id + source) ──
-- 기존 external_id 단독 유니크 제거 후 복합 유니크 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_policy_data_external_source'
    ) THEN
        ALTER TABLE policy_data DROP CONSTRAINT IF EXISTS policy_data_external_id_key;
        ALTER TABLE policy_data ADD CONSTRAINT uk_policy_data_external_source
            UNIQUE (external_id, source);
    END IF;
END $$;

-- ── 4. 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_policy_data_source     ON policy_data(source);
CREATE INDEX IF NOT EXISTS idx_policy_data_category   ON policy_data(category);
CREATE INDEX IF NOT EXISTS idx_policy_data_apply_end  ON policy_data(apply_end);
CREATE INDEX IF NOT EXISTS idx_policy_data_deleted_at ON policy_data(deleted_at);
