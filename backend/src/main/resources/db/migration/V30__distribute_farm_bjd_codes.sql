-- =============================================
-- V30: 농장 bjd_code 읍면 분산 + 주소 동기화
-- 
-- 목적: V27에서 '4183000000'으로 일괄 보정된 farms.bjd_code를
--        양평군 12개 읍면에 고르게 분산합니다.
--        address도 bjd_code와 일치하도록 동기화하여
--        TOWN_EXPR(address LIKE) 정합성을 확보합니다.
-- 영향: farms (bjd_code, address)
-- 위험도: 낮음 (미분류 farm만 대상, 실사용자 데이터 보호)
-- 비고: 데모 전용. 운영 전환 시 카카오 API 기반 실주소로 대체 필요.
--
-- 실제 데이터 분석 결과 (2026-05-19):
--   4183000000: 21건 (시드 20건 + V26 조합 1건) → 대상
--   정상 bjd_code: 7건 (실사용자 등록) → 보호
--     id=21 마일로네 농장 (4183036022, 단월면)
--     id=22 ㄷㄻㄻㅀ (5221010700, 김제시)
--     id=23 해피 농장 (4113511000, 성남시)
--     id=24 으남이네 (4183031022, 강상면)
--     id=25 으름이네 (5221046023, 김제시)
--     id=26 으름이네2 (4161010100, 광주시)
--     id=27 지은이네 농장 (4183037029, 청운면)
-- =============================================

-- 미분류 상태(4183000000)인 farm만 12개 읍면에 분배
-- 이미 정상 bjd_code를 가진 farm은 건드리지 않음
UPDATE farms
SET
    bjd_code = CASE (id % 12)
        WHEN 0  THEN '4183010'   -- 양평읍
        WHEN 1  THEN '4183020'   -- 강상면
        WHEN 2  THEN '4183030'   -- 강하면
        WHEN 3  THEN '4183040'   -- 양서면
        WHEN 4  THEN '4183050'   -- 옥천면
        WHEN 5  THEN '4183060'   -- 서종면
        WHEN 6  THEN '4183070'   -- 단월면
        WHEN 7  THEN '4183080'   -- 청운면
        WHEN 8  THEN '4183090'   -- 양동면
        WHEN 9  THEN '4183100'   -- 지평면
        WHEN 10 THEN '4183110'   -- 용문면
        WHEN 11 THEN '4183120'   -- 개군면
    END,
    address = '경기도 양평군 ' || CASE (id % 12)
        WHEN 0  THEN '양평읍'
        WHEN 1  THEN '강상면'
        WHEN 2  THEN '강하면'
        WHEN 3  THEN '양서면'
        WHEN 4  THEN '옥천면'
        WHEN 5  THEN '서종면'
        WHEN 6  THEN '단월면'
        WHEN 7  THEN '청운면'
        WHEN 8  THEN '양동면'
        WHEN 9  THEN '지평면'
        WHEN 10 THEN '용문면'
        WHEN 11 THEN '개군면'
    END || ' ' || id || '번지'
WHERE deleted_at IS NULL
  AND (bjd_code IS NULL OR bjd_code = '' OR bjd_code = '4183000000');
