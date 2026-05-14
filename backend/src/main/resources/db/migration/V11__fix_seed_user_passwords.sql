-- =============================================
-- V11: 시드 사용자 비밀번호 수정
-- V2에서 잘못된 BCrypt 해시가 입력되어 'test1234!'로 로그인 불가했던 문제 수정
-- 새 해시: BCrypt encode of 'test1234!'
-- =============================================

UPDATE users
SET password = '$2a$10$c5jowZbeFvjkdYi94J3gIulI1ZENt7ZVt/wZwPMe7SWuzhSEtLpai'
WHERE password = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu';
