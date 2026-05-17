-- 기존 API 명칭 변경
UPDATE api_sync_status 
SET display_name = '작물 리스트 외부 데이터' 
WHERE api_name = 'NONGSARO_CROP';

UPDATE api_sync_status 
SET display_name = '카카오 맵 데이터 (주소/위치)' 
WHERE api_name = 'KAKAO_LOCAL';

-- 신규 API 데이터 등록 (KAMIS_PRICE, SOIL_ENVIRONMENT)
INSERT INTO api_sync_status (api_name, display_name, sync_status, is_active, created_at, updated_at)
VALUES
    ('KAMIS_PRICE', '농수산물 유통 데이터 (KAMIS)', 'PENDING', true, NOW(), NOW()),
    ('SOIL_ENVIRONMENT', '흙토람 토양 환경 데이터', 'PENDING', true, NOW(), NOW())
ON CONFLICT (api_name) DO NOTHING;
