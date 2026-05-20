-- =============================================
-- V28: balance_data.region_code 4자리(시군구) 통일
-- 
-- 목적: V26에서 '4183000000'(10자리)으로 재삽입된 balance_data를
--        표준 4자리 시군구 코드로 정규화합니다.
-- 영향: balance_data
-- 위험도: 낮음 (GovDataPersistenceAdapter.queryBalance가 이미 SUBSTRING(1,4) 방어 중)
--
-- 실제 데이터 분석 결과 (2026-05-19):
--   4자리(4183): 8건 — V14/V20 유래 (random supply_ratio)
--   10자리(4183000000): 5건 — V26 유래 (KOSIS 기반 curated)
--   중복 4쌍: 쌀(id 5↔9), 감자(id 3↔11), 콩(id 6↔12), 토마토(id 7↔13)
--   비중복: 고구마(id 10, 10자리만 존재)
--   V14 전용(4자리만): 고추(id 1), 사과(id 2), 인삼(id 4), 방울토마토(id 8)
-- =============================================

-- Step 1: 4자리/10자리 중복 쌍에서 V14 random 데이터(4자리)를 제거
-- V26의 curated 데이터(10자리→이후 4자리로 정규화)를 보존합니다.
-- 고추/사과/인삼/방울토마토는 10자리 대응이 없으므로 삭제되지 않습니다.
DELETE FROM balance_data
WHERE id IN (
    SELECT bd_short.id
    FROM balance_data bd_short
    JOIN balance_data bd_long
      ON SUBSTRING(bd_long.region_code, 1, 4) = bd_short.region_code
     AND bd_long.crop_id  = bd_short.crop_id
     AND bd_long.year     = bd_short.year
     AND bd_long.season   = bd_short.season
    WHERE LENGTH(bd_short.region_code) <= 4
      AND LENGTH(bd_long.region_code) > 4
);

-- Step 2: 남은 10자리 코드를 4자리로 정규화
-- 대상: 쌀(id 9), 고구마(id 10), 감자(id 11), 콩(id 12), 토마토(id 13)
UPDATE balance_data
SET region_code = SUBSTRING(region_code, 1, 4)
WHERE LENGTH(region_code) > 4;
