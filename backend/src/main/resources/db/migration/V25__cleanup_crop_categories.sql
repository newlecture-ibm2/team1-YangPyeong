-- V25: crop_categories / product_categories 정리
-- 1) 카테고리명에서 [GS] 접두어 제거
-- 2) '기타' 카테고리 추가

-- crop_categories: [GS] 접두어 제거
UPDATE crop_categories SET name = REGEXP_REPLACE(name, '^\[GS\] ', '') WHERE name LIKE '[GS]%';

-- product_categories: [GS] 접두어 제거
UPDATE product_categories SET name = REGEXP_REPLACE(name, '^\[GS\] ', '') WHERE name LIKE '[GS]%';

-- crop_categories에 '기타' 카테고리 추가 (없을 경우만)
INSERT INTO crop_categories (name, description, display_order, is_active, created_at)
SELECT '기타', '기타 작물', 99, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM crop_categories WHERE name = '기타');
