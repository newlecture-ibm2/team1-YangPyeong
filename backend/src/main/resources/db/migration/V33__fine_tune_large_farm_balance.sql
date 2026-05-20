-- =============================================
-- V33: 대규모 농장(옥천면) 재배면적 미세 조정
-- 목적: 옥천면 몰림 현상으로 인한 차트 스케일 붕괴 방지
-- 전제: V32까지 실행된 상태
-- =============================================

UPDATE cultivation_registrations SET cultivation_area = 90000, farmer_estimated_yield = 41400 WHERE id = 51 AND crop_id = 1;
UPDATE cultivation_registrations SET cultivation_area = 15000, farmer_estimated_yield = 2100 WHERE id = 54 AND crop_id = 7;
UPDATE cultivation_registrations SET cultivation_area = 12000, farmer_estimated_yield = 17400 WHERE id = 53 AND crop_id = 4;
UPDATE cultivation_registrations SET cultivation_area = 8000, farmer_estimated_yield = 7800
WHERE id = 52 AND crop_id = (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1);
UPDATE cultivation_registrations SET cultivation_area = 5000, farmer_estimated_yield = 20000 WHERE id = 55 AND crop_id = 8;
