-- 커뮤니티 기본 카테고리 시드 데이터
INSERT INTO post_categories (name, description, display_order, is_active, created_at)
VALUES 
('자유게시판', '자유롭게 이야기를 나누는 공간입니다.', 1, true, NOW()),
('정보공유', '유용한 농업 정보나 팁을 공유하는 공간입니다.', 2, true, NOW()),
('Q&A', '궁금한 점을 묻고 답하는 공간입니다.', 3, true, NOW())
ON CONFLICT (name) DO NOTHING;
