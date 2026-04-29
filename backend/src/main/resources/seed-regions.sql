-- ═══════════════════════════════════════════════════════════════
-- FarmBalance — 지역 마스터(regions) Seed 데이터
-- 시도 → 시군구 → 읍면동 계층 구조
-- ═══════════════════════════════════════════════════════════════

-- 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS regions (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(10) NOT NULL UNIQUE,
    name       VARCHAR(30) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('PROVINCE','CITY','TOWN')),
    parent_id  BIGINT REFERENCES regions(id),
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(type);

-- 기존 데이터 정리 (멱등)
DELETE FROM regions WHERE code LIKE '4183%' AND type = 'TOWN';
DELETE FROM regions WHERE code IN ('4183','4182');
DELETE FROM regions WHERE code = '41';

-- 시도
INSERT INTO regions (id, code, name, type, parent_id) VALUES
(1, '41', '경기도', 'PROVINCE', NULL)
ON CONFLICT (code) DO NOTHING;

-- 시군구
INSERT INTO regions (id, code, name, type, parent_id) VALUES
(2, '4183', '양평군', 'CITY', 1),
(3, '4182', '가평군', 'CITY', 1)
ON CONFLICT (code) DO NOTHING;

-- 양평군 읍면동 (12개)
INSERT INTO regions (id, code, name, type, parent_id) VALUES
(10, '4183010', '양평읍', 'TOWN', 2),
(11, '4183020', '강상면', 'TOWN', 2),
(12, '4183030', '강하면', 'TOWN', 2),
(13, '4183040', '양서면', 'TOWN', 2),
(14, '4183050', '옥천면', 'TOWN', 2),
(15, '4183060', '서종면', 'TOWN', 2),
(16, '4183070', '단월면', 'TOWN', 2),
(17, '4183080', '청운면', 'TOWN', 2),
(18, '4183090', '양동면', 'TOWN', 2),
(19, '4183100', '지평면', 'TOWN', 2),
(20, '4183110', '용문면', 'TOWN', 2),
(21, '4183120', '개군면', 'TOWN', 2),
(22, '4183130', '산북면', 'TOWN', 2)
ON CONFLICT (code) DO NOTHING;

-- 시퀀스 보정
SELECT setval('regions_id_seq', 100, true);

-- users 테이블에 region_code 컬럼 추가 (없으면)
ALTER TABLE users ADD COLUMN IF NOT EXISTS region_code VARCHAR(10);
UPDATE users SET region_code = '4183' WHERE region = '양평군' AND region_code IS NULL;
UPDATE users SET region_code = '4182' WHERE region = '가평군' AND region_code IS NULL;
