-- =============================================
-- V10: 쇼핑 도메인 데모 시드 데이터
-- product_categories + products + uploads
-- =============================================

-- ──────────────────────────────────────────────
-- 1. 상품 카테고리
-- ──────────────────────────────────────────────
INSERT INTO product_categories (name, description, display_order, is_active) VALUES
    ('채소',       '잎채소, 뿌리채소, 열매채소 등 신선 채소류',     1, TRUE),
    ('과일',       '제철 과일과 견과류',                            2, TRUE),
    ('곡물',       '쌀, 잡곡, 콩 등',                              3, TRUE),
    ('가공식품',   '장아찌, 김치, 청 등 농가 직접 가공품',          4, TRUE),
    ('친환경',     '유기농/무농약 인증 농산물',                     5, TRUE),
    ('기타',       '버섯, 약초 등 기타 농산물',                     6, TRUE);

-- ──────────────────────────────────────────────
-- 2. 상품 (15개)
--   seller_id: V2에서 시드된 farmer1~farmer10 사용자
--   category_id: 위에서 방금 만든 카테고리 참조
--   harvest_record_id: NULL (선택)
--   status: ACTIVE (즉시 판매중)
-- ──────────────────────────────────────────────
INSERT INTO products (seller_id, category_id, name, price, stock, description, sales_count, status)
SELECT u.id AS seller_id, c.id AS category_id, p.name, p.price, p.stock, p.description, p.sales_count, 'ACTIVE'
FROM (VALUES
    ('farmer1@test.com',  '채소',     '양평 친환경 양파 3kg',           12000,  50, '양평 농가에서 직접 재배한 국산 양파입니다. 단단하고 매콤한 맛.', 24),
    ('farmer2@test.com',  '채소',     '햇감자 5kg',                     18000,  80, '강원도 햇감자, 포슬포슬한 식감이 일품입니다.', 17),
    ('farmer3@test.com',  '채소',     '국산 마늘 1kg',                  15000,  35, '6쪽 국산 마늘, 향이 진하고 매운 맛이 강합니다.', 12),
    ('farmer4@test.com',  '채소',     '대파 2단',                        7000,  60, '아삭한 식감의 대파, 국물 요리에 최적입니다.',  8),
    ('farmer5@test.com',  '과일',     '햇사과 부사 5kg',                25000,  40, '아삭하고 달콤한 부사 사과, 산지직송.', 31),
    ('farmer6@test.com',  '과일',     '제철 배 5kg',                    32000,  25, '꿀처럼 달콤한 신고배, 선물용 박스 포장.', 19),
    ('farmer7@test.com',  '과일',     '국산 블루베리 1kg',              28000,  20, '냉동 블루베리, 베이킹과 잼에 좋습니다.',  6),
    ('farmer8@test.com',  '곡물',     '햅쌀 10kg',                      42000, 100, '2025년 햅쌀, 도정 직후 배송으로 신선합니다.', 45),
    ('farmer9@test.com',  '곡물',     '국산 검은콩 1kg',                11000,  45, '서리태 검은콩, 콩밥에 좋습니다.',  9),
    ('farmer10@test.com', '곡물',     '잡곡 5종 혼합 1kg',              13000,  55, '귀리, 보리, 율무, 수수, 기장 5종 혼합.', 14),
    ('farmer1@test.com',  '가공식품', '집된장 1kg',                     22000,  18, '3년 숙성 전통 집된장, 깊은 맛.',  5),
    ('farmer2@test.com',  '가공식품', '매실청 1.5kg',                   24000,  30, '청매실 100%, 무첨가 매실청.', 11),
    ('farmer3@test.com',  '친환경',   '유기농 상추 모듬 500g',           9000,  40, '유기농 인증 잎채소 모듬 (상추/케일/청경채).', 22),
    ('farmer4@test.com',  '친환경',   '무농약 토마토 3kg',              19000,  35, '무농약 인증 완숙 토마토, 당도 6브릭스 이상.', 16),
    ('farmer5@test.com',  '기타',     '국산 표고버섯 500g',             14000,  28, '국산 참나무 표고버섯, 향이 진합니다.', 10)
) AS p(seller_email, category_name, name, price, stock, description, sales_count)
JOIN users u            ON u.email = p.seller_email
JOIN product_categories c ON c.name = p.category_name;

-- ──────────────────────────────────────────────
-- 3. 상품 이미지 (uploads 테이블)
--   entity_type = 'PRODUCT', entity_id = products.id
--   placehold.co 사용 (안정적, 텍스트 라벨 표시)
-- ──────────────────────────────────────────────
INSERT INTO uploads (entity_type, entity_id, file_type, file_url, original_name, display_order)
SELECT 'PRODUCT', p.id, 'IMAGE',
       'https://placehold.co/600x400/4ade80/ffffff?text=' || replace(p.name, ' ', '+'),
       p.name || '.jpg',
       0
FROM products p
WHERE p.created_at >= (SELECT MIN(created_at) FROM products WHERE sales_count > 0);

-- 일부 상품에 대표 이미지 외에 2번째 이미지 추가 (display_order = 1)
INSERT INTO uploads (entity_type, entity_id, file_type, file_url, original_name, display_order)
SELECT 'PRODUCT', p.id, 'IMAGE',
       'https://placehold.co/600x400/16a34a/ffffff?text=' || replace(p.name, ' ', '+') || '+상세',
       p.name || '_detail.jpg',
       1
FROM products p
WHERE p.sales_count >= 15;
