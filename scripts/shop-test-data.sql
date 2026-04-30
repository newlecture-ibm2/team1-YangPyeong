-- ============================================================
-- Shop 도메인 테스트 데이터 (10건씩)
-- 실행 순서: 삭제(역순) → users → product_categories → products → uploads → cart_items → orders → order_items
-- ============================================================

-- 0. 기존 테스트 데이터 삭제 (FK 역순)
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE email LIKE '%@test.com'));
DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM cart_items WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM uploads WHERE entity_type = 'PRODUCT' AND entity_id IN (SELECT id FROM products WHERE seller_id IN (SELECT id FROM users WHERE email LIKE '%@test.com'));
DELETE FROM products WHERE seller_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM product_categories WHERE name IN ('채소류', '과일류', '곡물·잡곡', '가공식품');
DELETE FROM users WHERE email LIKE '%@test.com';

-- 1. 테스트 유저 (판매자 2명 + 구매자 2명)
-- 비밀번호: test1234 (BCrypt 해시)
-- 시퀀스를 현재 최대 id 이후로 리셋 (PK 충돌 방지)
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users));

INSERT INTO users (email, password, name, phone, role, region, status, created_at) VALUES
('seller1@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '양평농장 김씨', '010-1111-1111', 'FARMER', '양평군', 'ACTIVE', NOW()),
('seller2@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '양평과수원 박씨', '010-2222-2222', 'FARMER', '양평군', 'ACTIVE', NOW()),
('buyer1@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '구매자 이씨', '010-3333-3333', 'GENERAL', '서울', 'ACTIVE', NOW()),
('buyer2@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '구매자 최씨', '010-4444-4444', 'GENERAL', '서울', 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. 상품 카테고리 (4개)
INSERT INTO product_categories (name, description, display_order, is_active, created_at) VALUES
('채소류', '양평 직접 재배 신선 채소', 1, true, NOW()),
('과일류', '양평 로컬 과일', 2, true, NOW()),
('곡물·잡곡', '양평 유기농 쌀·잡곡', 3, true, NOW()),
('가공식품', '양평 농산물 가공식품', 4, true, NOW())
ON CONFLICT (name) DO NOTHING;

-- 3. 상품 (10개) — seller_id, category_id는 위 INSERT 결과에 따라 조정 필요
-- seller1 = 첫번째 판매자, seller2 = 두번째 판매자
INSERT INTO products (seller_id, category_id, name, price, stock, description, sales_count, status, created_at) VALUES
((SELECT id FROM users WHERE email='seller1@test.com'), (SELECT id FROM product_categories WHERE name='채소류'), '양평 유기농 상추 500g', 3500, 100, '양평 청정 지역에서 재배한 유기농 상추입니다. 아삭한 식감과 신선함을 그대로 전해드립니다.', 45, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller1@test.com'), (SELECT id FROM product_categories WHERE name='채소류'), '양평 친환경 깻잎 100장', 4000, 80, '양평산 친환경 깻잎 100장 묶음입니다. 향이 진하고 부드럽습니다.', 32, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller1@test.com'), (SELECT id FROM product_categories WHERE name='채소류'), '양평 유기농 고추 1kg', 12000, 50, '양평에서 직접 재배한 유기농 고추입니다. 매운맛과 단맛의 조화가 일품입니다.', 28, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller2@test.com'), (SELECT id FROM product_categories WHERE name='과일류'), '양평 사과 5kg (선물용)', 35000, 30, '양평 과수원에서 정성껏 키운 사과입니다. 당도 14Brix 이상, 선물용 포장 가능합니다.', 67, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller2@test.com'), (SELECT id FROM product_categories WHERE name='과일류'), '양평 배 5kg', 42000, 25, '양평 배는 과즙이 풍부하고 아삭한 식감이 특징입니다. 명절 선물로도 좋습니다.', 53, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller2@test.com'), (SELECT id FROM product_categories WHERE name='과일류'), '양평 딸기 1kg', 18000, 40, '양평 하우스에서 재배한 딸기입니다. 당도가 높고 향이 진합니다.', 89, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller1@test.com'), (SELECT id FROM product_categories WHERE name='곡물·잡곡'), '양평 유기농 쌀 10kg', 45000, 20, '양평 청정 수질로 재배한 유기농 쌀입니다. 밥을 지으면 윤기가 흐르고 맛이 좋습니다.', 120, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller1@test.com'), (SELECT id FROM product_categories WHERE name='곡물·잡곡'), '양평 잡곡 혼합 2kg', 15000, 35, '양평산 찰보리, 수수, 기장 등 10가지 잡곡을 혼합한 건강 잡곡입니다.', 41, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller2@test.com'), (SELECT id FROM product_categories WHERE name='가공식품'), '양평 고추장 500g', 9800, 60, '양평 전통 방식으로 담근 고추장입니다. 2년 숙성으로 깊은 맛이 납니다.', 76, 'ACTIVE', NOW()),
((SELECT id FROM users WHERE email='seller2@test.com'), (SELECT id FROM product_categories WHERE name='가공식품'), '양평 된장 1kg', 12000, 45, '양평 메주로 직접 담근 전통 된장입니다. 찌개, 쌈장 등 다양하게 활용 가능합니다.', 58, 'ACTIVE', NOW());

-- 4. 상품 이미지 (상품당 2~3장)
-- 플레이스홀더 이미지 URL 사용 (실제 환경에서는 업로드된 이미지 경로)
INSERT INTO uploads (entity_type, entity_id, file_type, file_url, display_order, created_at) VALUES
('PRODUCT', (SELECT id FROM products WHERE name='양평 유기농 상추 500g'), 'IMAGE', '/uploads/products/lettuce_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 유기농 상추 500g'), 'IMAGE', '/uploads/products/lettuce_2.jpg', 1, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 친환경 깻잎 100장'), 'IMAGE', '/uploads/products/perilla_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 친환경 깻잎 100장'), 'IMAGE', '/uploads/products/perilla_2.jpg', 1, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 유기농 고추 1kg'), 'IMAGE', '/uploads/products/pepper_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 사과 5kg (선물용)'), 'IMAGE', '/uploads/products/apple_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 사과 5kg (선물용)'), 'IMAGE', '/uploads/products/apple_2.jpg', 1, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 사과 5kg (선물용)'), 'IMAGE', '/uploads/products/apple_3.jpg', 2, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 배 5kg'), 'IMAGE', '/uploads/products/pear_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 배 5kg'), 'IMAGE', '/uploads/products/pear_2.jpg', 1, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 딸기 1kg'), 'IMAGE', '/uploads/products/strawberry_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 딸기 1kg'), 'IMAGE', '/uploads/products/strawberry_2.jpg', 1, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 유기농 쌀 10kg'), 'IMAGE', '/uploads/products/rice_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 잡곡 혼합 2kg'), 'IMAGE', '/uploads/products/grain_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 고추장 500g'), 'IMAGE', '/uploads/products/gochujang_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 고추장 500g'), 'IMAGE', '/uploads/products/gochujang_2.jpg', 1, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 된장 1kg'), 'IMAGE', '/uploads/products/doenjang_1.jpg', 0, NOW()),
('PRODUCT', (SELECT id FROM products WHERE name='양평 된장 1kg'), 'IMAGE', '/uploads/products/doenjang_2.jpg', 1, NOW());

-- 5. 장바구니 (구매자1이 3개 상품 담기)
INSERT INTO cart_items (user_id, product_id, quantity, created_at) VALUES
((SELECT id FROM users WHERE email='buyer1@test.com'), (SELECT id FROM products WHERE name='양평 유기농 상추 500g'), 2, NOW()),
((SELECT id FROM users WHERE email='buyer1@test.com'), (SELECT id FROM products WHERE name='양평 사과 5kg (선물용)'), 1, NOW()),
((SELECT id FROM users WHERE email='buyer1@test.com'), (SELECT id FROM products WHERE name='양평 유기농 쌀 10kg'), 1, NOW());

-- 6. 주문 (3건)
INSERT INTO orders (buyer_id, order_number, total_amount, status, receiver_name, receiver_phone, shipping_address, shipping_memo, created_at) VALUES
((SELECT id FROM users WHERE email='buyer1@test.com'), 'ORD-202604290001-A1B2', 52000, 'ORDERED', '이민수', '010-3333-3333', '서울시 강남구 역삼동 123-45 아파트 101동 202호', '부재 시 문 앞에 놓아주세요', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE email='buyer2@test.com'), 'ORD-202604280001-C3D4', 35000, 'ACCEPTED', '최영희', '010-4444-4444', '서울시 서초구 서초동 456-78 오피스텔 503호', '경비실에 맡겨주세요', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE email='buyer1@test.com'), 'ORD-202604270001-E5F6', 18000, 'SHIPPED', '이민수', '010-3333-3333', '서울시 강남구 역삼동 123-45 아파트 101동 202호', '', NOW() - INTERVAL '5 days');

-- 7. 주문 항목
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, created_at) VALUES
-- 주문1: 상추 2개 + 쌀 1개 = 7000 + 45000 = 52000
((SELECT id FROM orders WHERE order_number='ORD-202604290001-A1B2'), (SELECT id FROM products WHERE name='양평 유기농 상추 500g'), 2, 3500, 7000, NOW()),
((SELECT id FROM orders WHERE order_number='ORD-202604290001-A1B2'), (SELECT id FROM products WHERE name='양평 유기농 쌀 10kg'), 1, 45000, 45000, NOW()),
-- 주문2: 사과 1개 = 35000
((SELECT id FROM orders WHERE order_number='ORD-202604280001-C3D4'), (SELECT id FROM products WHERE name='양평 사과 5kg (선물용)'), 1, 35000, 35000, NOW()),
-- 주문3: 딸기 1개 = 18000
((SELECT id FROM orders WHERE order_number='ORD-202604270001-E5F6'), (SELECT id FROM products WHERE name='양평 딸기 1kg'), 1, 18000, 18000, NOW());

-- ============================================================
-- 확인 쿼리
-- ============================================================
-- SELECT * FROM users WHERE email LIKE '%test.com';
-- SELECT p.*, pc.name as category FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id;
-- SELECT * FROM uploads WHERE entity_type = 'PRODUCT';
-- SELECT * FROM cart_items;
-- SELECT o.*, oi.* FROM orders o JOIN order_items oi ON o.id = oi.order_id;
