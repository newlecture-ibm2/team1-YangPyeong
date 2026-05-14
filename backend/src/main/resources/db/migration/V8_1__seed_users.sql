-- =============================================
-- V8_1: 사용자 및 활동 이력 시드 데이터 (100명)
-- 관리자(1), 지자체(1), 일반유저(44), 농부(54)
-- =============================================

-- 1. 기본 사용자 생성 (비밀번호는 'password'의 암호화된 예시값)
-- 실제 프로젝트의 암호화 방식에 맞게 조정 필요 (여기서는 예시 해시값 사용)
INSERT INTO users (email, password, name, phone, role, status, address, created_at)
VALUES 
('admin@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '최고관리자', '010-0000-0000', 'ADMIN', 'ACTIVE', '서울특별시 강남구', NOW()),
('gov@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '양평군청담당자', '010-1111-1111', 'GOV', 'ACTIVE', '경기도 양평군 양평읍', NOW());

-- 2. 일반유저 (44명: user1~user44)
DO $$
BEGIN
    FOR i IN 1..44 LOOP
        INSERT INTO users (email, password, name, role, status, created_at)
        VALUES ('user' || i || '@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '일반유저' || i, 'USER', 'ACTIVE', NOW() - (i || ' days')::interval);
    END LOOP;
END $$;

-- 3. 농부 (54명: farmer1~farmer54)
DO $$
BEGIN
    FOR i IN 1..54 LOOP
        INSERT INTO users (email, password, name, phone, role, status, address, created_at)
        VALUES ('farmer' || i || '@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', '농부' || i, '010-2222-' || LPAD(i::text, 4, '0'), 'FARMER', 'ACTIVE', '경기도 양평군 농가' || i, NOW() - (i || ' days')::interval);
    END LOOP;
END $$;

-- 4. 농부들의 농장 및 재배 이력 등록
DO $$
DECLARE
    f_id BIGINT;
    c_id BIGINT;
    reg_id BIGINT;
BEGIN
    -- 일부 농부(1~20번)에게 농장 및 재배 이력 부여
    FOR i IN 1..20 LOOP
        SELECT id INTO f_id FROM users WHERE email = 'farmer' || i || '@test.com';
        
        -- 농장 등록 (중복 방지를 위해 IF NOT EXISTS 로직 대신 단순 루프)
        INSERT INTO farms (user_id, name, address, area, certification_status, status, created_at)
        VALUES (f_id, '농부' || i || '의 농장', '양평군 어느마을 ' || i, 3000 + (i * 100), 'APPROVED', 'OPERATING', NOW() - interval '30 days')
        RETURNING id INTO reg_id;

        -- 작물 선택 (순환 선택)
        SELECT id INTO c_id FROM crops ORDER BY id LIMIT 1 OFFSET (i % 5);
        
        -- 재배 등록
        INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, status, created_at)
        VALUES (reg_id, c_id, 2000, 'ACTIVE', NOW() - interval '25 days')
        RETURNING id INTO reg_id; -- 여기서는 cultivation_registration_id로 사용

        -- 활동 이력 (재배 이력)
        INSERT INTO cultivation_history (farm_id, cultivation_registration_id, activity_type, activity_content, record_date)
        VALUES 
        ((SELECT farm_id FROM cultivation_registrations WHERE id = reg_id), reg_id, 'SOWING', '씨앗 파종 완료', CURRENT_DATE - 20),
        ((SELECT farm_id FROM cultivation_registrations WHERE id = reg_id), reg_id, 'FERTILIZING', '비료 살포', CURRENT_DATE - 10);
    END LOOP;
END $$;

-- 5. 일반유저 중 일부 활동 내역 (게시글 등)
DO $$
DECLARE
    u_id BIGINT;
    cat_id BIGINT;
    p_id BIGINT;
BEGIN
    -- 1번 유저: 커뮤니티 활동
    SELECT id INTO u_id FROM users WHERE email = 'user1@test.com';
    SELECT id INTO cat_id FROM post_categories LIMIT 1;
    
    -- 게시글 작성
    INSERT INTO posts (author_id, category_id, title, content, created_at)
    VALUES (u_id, cat_id, '안녕하세요 가입했습니다', '농업에 관심이 많아 가입했습니다.', NOW() - interval '5 days')
    RETURNING id INTO p_id;
    
    -- 댓글
    INSERT INTO comments (post_id, author_id, content, created_at)
    VALUES (p_id, u_id, '환영합니다!', NOW() - interval '4 days');

    -- 특이 케이스: 농부가 아니면서 농장을 등록한 유저 (user2)
    SELECT id INTO u_id FROM users WHERE email = 'user2@test.com';
    INSERT INTO farms (user_id, name, address, area, certification_status, status)
    VALUES (u_id, '도시인의 주말농장', '양평군 옥천면 123', 150.0, 'APPROVED', 'OPERATING');
END $$;
