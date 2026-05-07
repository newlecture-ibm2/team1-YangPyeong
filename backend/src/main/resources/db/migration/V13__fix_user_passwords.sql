-- ═══════════════════════════════════════════════════════════════
-- V13: 사용자 비밀번호 재수정 (올바른 BCrypt 해시 적용)
--   - V5/V11의 해시가 잘못 생성되어 로그인 불가 문제 수정
--   - 평문: test1234!
--   - BCrypt(10 rounds) 검증 완료 해시
-- ═══════════════════════════════════════════════════════════════

UPDATE users 
SET password = '$2a$10$X2tZFhAneKPtVR5qxgKUqehZQajSvteP/LrJ50ix70cRG/hHDzau.'
WHERE provider = 'LOCAL';
