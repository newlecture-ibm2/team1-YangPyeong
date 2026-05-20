-- =============================================
-- V29: 양평군 읍면동 regions 확장 (3개 → 12개)
-- 
-- 목적: 현재 양평읍/강상면/강하면 3개만 등록된 regions 테이블에
--        양평군 산하 나머지 9개 읍면을 추가합니다.
-- 영향: regions
-- 위험도: 낮음 (ON CONFLICT으로 중복 방어)
-- 비고: 코드 체계는 기존 V2의 '4183010~030' 패턴 유지
-- =============================================

INSERT INTO regions (code, name, type, parent_id) VALUES
    ('4183040', '양서면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183050', '옥천면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183060', '서종면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183070', '단월면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183080', '청운면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183090', '양동면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183100', '지평면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183110', '용문면', 'TOWN', (SELECT id FROM regions WHERE code = '4183')),
    ('4183120', '개군면', 'TOWN', (SELECT id FROM regions WHERE code = '4183'))
ON CONFLICT (code) DO NOTHING;
