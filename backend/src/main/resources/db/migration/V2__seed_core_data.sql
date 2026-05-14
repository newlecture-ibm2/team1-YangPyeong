-- =============================================
-- V2: 기초 데이터 및 사용자 시드 통합
-- 카테고리, 지역, 기초 작물, 100명 사용자 및 활동 이력
-- =============================================

-- 1. 카테고리 데이터
INSERT INTO post_categories (name, description, display_order) VALUES
('자유게시판', '자유로운 소통 공간', 1),
('정보공유', '농업 기술 및 정보 공유', 2),
('Q&A', '질문과 답변', 3);

INSERT INTO crop_categories (name, description, display_order) VALUES
('곡물', '벼, 보리 등', 1),
('채소', '고추, 상추 등', 2),
('과수', '사과, 배 등', 3),
('서류', '감자, 고구마 등', 4),
('특용', '인삼 등', 5);

-- 2. 행정구역 데이터
INSERT INTO regions (code, name, type, parent_id) VALUES
('41', '경기도', 'PROVINCE', NULL);

INSERT INTO regions (code, name, type, parent_id) VALUES
('4183', '양평군', 'CITY', (SELECT id FROM regions WHERE code = '41')),
('4182', '가평군', 'CITY', (SELECT id FROM regions WHERE code = '41'));

INSERT INTO regions (code, name, type, parent_id) VALUES
('4183010', '양평읍', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
('4183020', '강상면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
('4183030', '강하면', 'TOWN', (SELECT id FROM regions WHERE code = '4183'));

-- 3. 기초 작물 데이터
INSERT INTO crops (category_id, code, name, growth_days) VALUES
((SELECT id FROM crop_categories WHERE name = '곡물'), 'RICE', '벼', 150),
((SELECT id FROM crop_categories WHERE name = '채소'), 'PEPPER', '고추', 150),
((SELECT id FROM crop_categories WHERE name = '과수'), 'APPLE', '사과', 180),
((SELECT id FROM crop_categories WHERE name = '서류'), 'POTATO', '감자', 90),
((SELECT id FROM crop_categories WHERE name = '특용'), 'GINSENG', '인삼', 1800);

-- 4. 사용자 시드 (100명)
-- 관리자 & 지자체
INSERT INTO users (email, password, name, phone, role, status, address) VALUES
('admin@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '최고관리자', '010-0000-0000', 'ADMIN', 'ACTIVE', '서울특별시 강남구'),
('gov@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '양평군청담당자', '010-1111-1111', 'GOV', 'ACTIVE', '경기도 양평군 양평읍');

-- 일반유저 (44명)
DO $$
BEGIN
    FOR i IN 1..44 LOOP
        INSERT INTO users (email, password, name, role, status)
        VALUES ('user' || i || '@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '일반유저' || i, 'USER', 'ACTIVE');
    END LOOP;
END $$;

-- 농부 (54명)
DO $$
BEGIN
    FOR i IN 1..54 LOOP
        INSERT INTO users (email, password, name, role, status, address)
        VALUES ('farmer' || i || '@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '농부' || i, 'FARMER', 'ACTIVE', '양평군 어느마을 ' || i);
    END LOOP;
END $$;

-- 5. 활동 이력 (농장 및 재배 등록)
DO $$
DECLARE
    f_id BIGINT;
    c_id BIGINT;
    reg_id BIGINT;
BEGIN
    FOR i IN 1..20 LOOP
        SELECT id INTO f_id FROM users WHERE email = 'farmer' || i || '@test.com';
        
        INSERT INTO farms (user_id, name, address, area, certification_status)
        VALUES (f_id, '농부' || i || '의 농장', '양평군 어느마을 ' || i, 3000 + (i * 100), 'APPROVED')
        RETURNING id INTO f_id; -- farm_id로 재활용

        SELECT id INTO c_id FROM crops ORDER BY id LIMIT 1 OFFSET (i % 5);
        
        INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, status)
        VALUES (f_id, c_id, 2000, 'ACTIVE')
        RETURNING id INTO reg_id;

        INSERT INTO cultivation_history (farm_id, cultivation_registration_id, activity_type, activity_content, record_date)
        VALUES (f_id, reg_id, 'SOWING', '씨앗 파종 완료', CURRENT_DATE - 20);
    END LOOP;
END $$;

-- 6. 커뮤니티 활동 (일반유저)
INSERT INTO posts (author_id, category_id, title, content)
VALUES ((SELECT id FROM users WHERE email = 'user1@test.com'), (SELECT id FROM post_categories WHERE name = '자유게시판'), '가입인사', '반갑습니다.');

INSERT INTO comments (post_id, author_id, content)
VALUES (
    (SELECT id FROM posts WHERE title = '가입인사' ORDER BY id LIMIT 1),
    (SELECT id FROM users WHERE email = 'user1@test.com'),
    '댓글 테스트'
);

-- 7. API 연동상태 초기 데이터
INSERT INTO api_sync_status (api_name, display_name, sync_status, is_active, created_at, updated_at)
VALUES
    ('NONGSARO_CROP', '농사로 작물 마스터', 'PENDING', true, NOW(), NOW()),
    ('POLICY_DATA', '지자체 정책 데이터', 'PENDING', true, NOW(), NOW()),
    ('WEATHER_RECORD', '기상청 날씨 데이터', 'PENDING', true, NOW(), NOW()),
    ('KAKAO_LOCAL', '카카오 로컬 주소 API', 'PENDING', true, NOW(), NOW())
ON CONFLICT (api_name) DO NOTHING;

-- 8. 작물 재배환경 예제
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days, major_pests) VALUES
('벼', 5.5, 6.5, '20~30°C', 25.0, '양토, 점토', 2, '4월순 ~ 5월순', '9월순 ~ 10월중순', 150, '잎집무늬마름병, 멸구류'),
('보리', 6.0, 7.0, '12~18°C', 20.0, '점토,사양토', 2, '10월순 ~ 10월순', '5월순 ~ 6월중순', 240, '줄무늬병,붉은곰팡이병,검은검은얼룩병'),
('밀', 6.0, 7.0, '10~20°C', 20.0, '점토,사양토', 2, '10월중순 ~ 11월순', '6월순 ~ 6월순', 240, '붉은병,흰가루병,진딧물'),
('수수', 6.0, 7.0, '20~30°C', 25.0, '점토,사양토', 2, '4월순 ~ 5월순', '7월순 ~ 8월중순', 90, '잎선충병,검은가루병,수수호랑나비'),
('조', 6.0, 7.0, '25~30°C', 20.0, '점토,사양토', 2, '5월중순 ~ 6월순', '9월순 ~ 10월순', 120, '잎선충잎들병,붉은병,조명나방'),
('메밀', 6.0, 7.0, '22~28°C', 20.0, '점토,사양토', 2, '5월순 ~ 5월순', '9월순 ~ 9월순', 120, '붉은병,잎선충잎들병,조명나방'),
('콩', 5.5, 7.0, '18~25°C', 20.0, '점토,사양토', 1, '6월중순 ~ 7월순', '9월순 ~ 10월중순', 75, '붉은병,가루깍지벌레,잎선충잎들병'),
('옥수수', 6.0, 7.0, '20~28°C', 25.0, '점토,양토', 2, '5월순 ~ 6월중순', '10월순 ~ 10월순', 130, '옥수수잎병,옥수수마름병,진딧물'),
('팥', 6.0, 6.5, '20~28°C', 20.0, '점토,사양토', 2, '6월순 ~ 6월순', '10월순 ~ 10월순', 120, '팥잎병,붉은병,진딧물'),
('들깨', 6.0, 7.0, '22~30°C', 20.0, '점토,사양토', 2, '5월중순 ~ 6월순', '9월순 ~ 10월중순', 100, '팥잎병,붉은병,옥수수마름병'),
('감자', 5.0, 6.0, '15~20°C', 30.0, '점토,사양토', 2, '3월순 ~ 4월순', '6월중순 ~ 7월순', 90, '역병,가루뿌리병,총채벌레'),
('고구마', 5.5, 6.5, '20~30°C', 25.0, '사양토,점토', 2, '4월순 ~ 5월중순', '9월순 ~ 10월중순', 120, '검은무늬병,뿌리썩음병,나방류'),
('참마', 6.0, 6.5, '20~28°C', 30.0, '점토,사양토', 3, '2월 ~ 3월(정식)', '6월 ~ 10월', 120, '역병,용암고구마병,가루깍지벌레,진딧물'),
('고추', 6.0, 6.8, '20~28°C', 30.0, '점토,사양토', 3, '2월(정식) ~ 5월(정식)', '7월 ~ 10월', 150, '팥잎병,가루깍지벌레,모자이크,진딧물'),
('토마토', 6.0, 7.0, '18~28°C', 25.0, '점토,사양토', 3, '3월 ~ 4월(정식)', '5월 ~ 9월', 60, '곰팡이병,가루깍지벌레,실내가루이'),
('호박', 5.5, 6.8, '20~28°C', 25.0, '점토,사양토', 2, '4월 ~ 5월', '7월 ~ 10월', 90, '곰팡이병,가루깍지벌레,모자이크'),
('수박', 6.0, 7.0, '22~30°C', 25.0, '사양토,점토', 4, '3월(정식) ~ 5월(정식)', '7월 ~ 8월', 90, '팥잎병,곰팡이병,모자이크'),
('참외', 6.0, 7.0, '22~30°C', 25.0, '사양토,점토', 4, '2월(정식) ~ 3월(정식)', '5월 ~ 8월', 80, '곰팡이병,가루깍지벌레,모자이크'),
('인삼', 5.5, 6.5, '15~22°C', 30.0, '점토,사양토', 4, '8월 ~ 9월(정식)', '12월 ~ 5월', 240, '가루깍지벌레,용암고구마병,진딧물'),
('배추', 6.0, 7.0, '15~22°C', 25.0, '점토,양토', 2, '8월중순 ~ 9월순 (가을)', '10월순 ~ 11월중순', 70, '무름병,곰팡이병,배추좀나방'),
('양배추', 6.0, 7.0, '15~22°C', 25.0, '점토,사양토', 2, '7월순 ~ 8월순', '11월 ~ 12월', 90, '무름병,곰팡이병,구름무늬병'),
('상추', 6.0, 7.0, '15~20°C', 25.0, '점토,사양토', 1, '3월 ~ 10월', '파종 후 30~50일', 40, '곰팡이병,무름병,굴파리'),
('셀러리', 6.5, 7.0, '12~18°C', 25.0, '점토,사양토', 1, '3월 ~ 10월', '파종 후 30~45일', 35, '곰팡이병,무름병,총채벌레'),
('무', 5.5, 6.8, '15~22°C', 25.0, '점토,사양토', 2, '8월중순 ~ 9월순 (가을)', '10월순 ~ 11월중순', 60, '무름병,곰팡이병,뿌리썩음병'),
('브로콜리', 6.0, 7.0, '15~22°C', 25.0, '사양토,점토', 2, '7월순 ~ 7월순', '10월중순 ~ 11월순', 100, '무름병,곰팡이병,가루깍지벌레'),
('대파', 6.0, 7.0, '15~22°C', 25.0, '점토,양토', 2, '9월중순 (파종) ~ 11월(정식)', '6월순 ~ 6월순', 240, '무름병,곰팡이병,모자이크'),
('마늘', 6.0, 7.0, '15~22°C', 25.0, '점토,사양토', 2, '9월순 ~ 10월순', '5월순 ~ 6월중순', 240, '무름병,가루뿌리병,모자이크'),
('양파', 6.5, 7.0, '15~22°C', 25.0, '점토,사양토', 2, '3월 ~ 4월(정식)', '10월 ~ 12월', 120, '곰팡이병,무름병,모자이크'),
('생강', 6.0, 6.5, '20~28°C', 30.0, '점토,사양토', 3, '4월중순 ~ 5월순', '10월순 ~ 11월순', 180, '역병,가루깍지벌레,총채벌레'),
('참깨', 6.0, 7.0, '22~28°C', 20.0, '점토,사양토', 2, '5월순 ~ 6월순', '8월순 ~ 9월순', 90, '들깨마름병,가루깍지벌레,모자이크'),
('배', 5.5, 6.5, '15~20°C', 25.0, '점토,사양토', 4, '3월 ~ 4월', '10월 ~ 11월', 180, '곰팡이병,무름병,총채벌레'),
('사과', 6.0, 6.5, '18~25°C', 30.0, '점토,사양토', 4, '3월(물못 정식)', '9월 ~ 11월', 180, '검은별무늬병,진딧물,나방류'),
('포도', 5.5, 6.5, '18~25°C', 30.0, '점토,사양토', 4, '3월(물못 정식)', '9월 ~ 10월', 180, '검은별무늬병,용암고구마병,껍질벌레'),
('자두', 6.0, 7.0, '20~28°C', 25.0, '점토,사양토', 4, '3월(물못 정식)', '8월 ~ 10월', 180, '팥잎병,곰팡이병,모자이크'),
('복숭아', 6.0, 6.5, '18~28°C', 25.0, '사양토,점토', 4, '3월(물못 정식)', '7월 ~ 9월', 150, '곰팡이구름병,팥잎병,복숭아순나방'),
('감', 6.0, 6.5, '18~25°C', 25.0, '점토,양토', 3, '3월(물못 정식)', '10월 ~ 11월', 180, '팥잎병,총채벌레,나방류'),
('감귤', 5.5, 6.5, '15~25°C', 25.0, '점토,사양토', 3, '3월(물못 정식)', '10월 ~ 12월', 270, '팥잎병,총채벌레,진딧물'),
('블루베리', 4.5, 5.5, '18~25°C', 30.0, '사양토,점토', 3, '3월(물못 정식)', '6월 ~ 8월', 120, '팥잎병,들깨마름병,진딧물'),
('카틀레야', 6.0, 7.0, '12~18°C', 0.0, '배수,사양', 2, '사중 (배수 입상)', '입상 후 15~25일', 25, '고구마병,곰팡이성병,뿌리'),
('세고버섯', 5.0, 6.0, '15~22°C', 0.0, '내목,사양', 3, '속바구니 (모종)', '모종 후 6개월 ~ 1년', 180, '고구마병,버섯뿌리,곰팡이성내'),
('청경채', 6.0, 7.0, '15~20°C', 25.0, '점토,사양토', 1, '3월 ~ 10월', '파종 후 30~50일', 40, '곰팡이병,무름병,모자이크')
ON CONFLICT (crop_name) DO NOTHING;
