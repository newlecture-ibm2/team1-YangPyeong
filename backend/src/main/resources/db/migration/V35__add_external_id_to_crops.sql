-- V35: Add external_id and data_source to crops and crop_categories

-- 1. crop_categories 테이블 변경
ALTER TABLE crop_categories 
ADD COLUMN external_id VARCHAR(50),
ADD COLUMN data_source VARCHAR(20) DEFAULT 'MANUAL';

-- 2. crops 테이블 변경
ALTER TABLE crops 
ADD COLUMN external_id VARCHAR(50),
ADD COLUMN data_source VARCHAR(20) DEFAULT 'MANUAL';

-- 3. 인덱스 추가 (동기화 시 빠른 조회를 위해)
CREATE INDEX idx_crop_categories_external_id ON crop_categories(external_id);
CREATE INDEX idx_crops_external_id ON crops(external_id);

-- 4. API 동기화 및 헬스 체크 상태 관리를 위한 기본 데이터 세팅
INSERT INTO api_sync_status (api_name, display_name, sync_status, is_active, created_at, updated_at)
VALUES 
    ('NONGSARO_CROP', '농사로 작물 마스터', 'PENDING', true, NOW(), NOW()),
    ('POLICY_DATA', '지자체 정책 데이터', 'PENDING', true, NOW(), NOW()),
    ('WEATHER_RECORD', '기상청 날씨 데이터', 'PENDING', true, NOW(), NOW()),
    ('KAKAO_LOCAL', '카카오 로컬 주소 API', 'PENDING', true, NOW(), NOW()),
    ('AI_SERVER', '내부 AI 분석 서버', 'PENDING', true, NOW(), NOW())
ON CONFLICT (api_name) DO NOTHING;
