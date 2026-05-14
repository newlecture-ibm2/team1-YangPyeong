-- =============================================
-- V29: Seed Yangpyeong Crop Production Stats (KOSIS + ?몄??묐Ъ ?꾪솴 ?곗씠???듯빀)
-- ?묓룊援??섍툒 遺꾩꽍???꾪븳 ?ㅼ쭏?곸씤 湲곗?媛??곸옱
-- =============================================

INSERT INTO crop_production_stats (itm_nm, region_code, region_name, year, cultivated_area, yield_per_10a, total_production, unit_nm)
VALUES
-- [誘멸끝] ?묓룊援?? (移쒗솚寃??ы븿)
('?', 'YP', '?묓룊援?, 2024, 4500.00, 510.00, 22950.00, '??),
('?', 'YP', '?묓룊援?, 2023, 4550.00, 505.00, 22977.00, '??),

-- [?쒕쪟] ?묓룊援?媛먯옄, 怨좉뎄留?
('媛먯옄', 'YP', '?묓룊援?, 2023, 280.00, 2600.00, 7280.00, '??),
('怨좉뎄留?, 'YP', '?묓룊援?, 2023, 310.00, 1500.00, 4650.00, '??),

-- [?먮쪟] 肄?(?묓룊援?二쇱슂 ?묐Ъ)
('肄?, 'YP', '?묓룊援?, 2023, 420.00, 180.00, 756.00, '??),

-- [?몄? 梨꾩냼瑜? ?띾┝異뺤궛?앺뭹遺 CSV 湲곕컲 ?묓룊援?寃쎄린???ㅻ뜲?댄꽣
('?대Т', 'YP', '?묓룊援?, 2019, 0.17, 1200.00, 2.04, '??), -- ?묓룊援??쒖쥌硫??대Т ?곗씠??湲곕컲 (1747??-> 0.17ha)
('?좊쭏??, 'YP', '?묓룊援?, 2023, 12.00, 6000.00, 72.00, '??),
('諛⑹슱?좊쭏??, 'YP', '?묓룊援?, 2023, 8.50, 4500.00, 38.25, '??),

-- [?뱀닔] ?묓룊援?移쒗솚寃??뱁솕 ?곗씠??
('移쒗솚寃??', 'YP', '?묓룊援?, 2023, 1200.00, 480.00, 5760.00, '??),
('移쒗솚寃?媛먯옄', 'YP', '?묓룊援?, 2023, 85.00, 2200.00, 187.00, '??),

-- 寃쎌?硫댁쟻 ?듦퀎 (?묓룊援??꾩껜 湲곗?)
('寃쎌?硫댁쟻_??, 'YP', '?묓룊援?, 2023, 4600.00, 0, 0, 'ha'),
('寃쎌?硫댁쟻_諛?, 'YP', '?묓룊援?, 2023, 4100.00, 0, 0, 'ha')

ON CONFLICT (itm_nm, region_code, year) DO UPDATE SET
    cultivated_area = EXCLUDED.cultivated_area,
    yield_per_10a = EXCLUDED.yield_per_10a,
    total_production = EXCLUDED.total_production,
    updated_at = NOW();
-- =============================================
-- V11: ?섍툒 遺꾩꽍 ??쒕낫???쒖뿰??媛???щ같 ?곗씠???곸옱
-- 媛??곹깭媛?怨쇱엵, ?곸젙, 遺議???怨④퀬猷??섏삤?꾨줉 援ъ꽦
-- =============================================

DO $$
DECLARE
    v_farm_id BIGINT;
    v_category_grain_id BIGINT;
    v_category_veg_id BIGINT;
BEGIN
    -- 1. ?뚯뒪?몄슜 ?띿옣 議고쉶 (V8_1?먯꽌 ?앹꽦??farmer1@test.com ?좎????띿옣 ?쒖슜)
    SELECT id INTO v_farm_id FROM farms WHERE user_id = (SELECT id FROM users WHERE email = 'farmer1@test.com') LIMIT 1;
    
    -- 留뚯빟 ?띿옣???녿떎硫??쒖뿰?⑹쑝濡??섎굹 ?앹꽦
    IF v_farm_id IS NULL THEN
        INSERT INTO farms (user_id, name, address, area, certification_status)
        VALUES ((SELECT id FROM users WHERE email = 'farmer1@test.com'), '?쒖뿰??媛???띿옣', '寃쎄린???묓룊援??묓룊??以묒븰濡?1', 5000.0, 'APPROVED')
        RETURNING id INTO v_farm_id;
    END IF;

    -- 2. ?꾩닔 ?묐Ъ ?곗씠???뺤씤 諛?蹂댁땐
    SELECT id INTO v_category_grain_id FROM crop_categories WHERE name = '怨〓Ъ' LIMIT 1;
    SELECT id INTO v_category_veg_id FROM crop_categories WHERE name = '梨꾩냼' LIMIT 1;
    
    -- ?쒖뿰???꾩슂??異붽? ?묐Ъ ?깅줉 (湲곗〈 V8 ?곗씠?곗? 寃뱀튂硫??낅뜲?댄듃)
    INSERT INTO crops (category_id, code, name, growth_days)
    VALUES 
        (v_category_grain_id, 'RICE', '踰?, 150),
        (v_category_grain_id, 'SOYBEAN', '肄?, 130),
        (v_category_veg_id, 'CHERRY_TOMATO', '諛⑹슱?좊쭏??, 120),
        (v_category_veg_id, 'TOMATO', '?좊쭏??, 120)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    -- 3. 湲곗〈 ?쒖뿰 ?곗씠????젣 (?대떦 ?띿옣???곗씠?곕쭔 珥덇린??
    DELETE FROM cultivation_registrations WHERE farm_id = v_farm_id;

    -- 4. ?묐Ъ蹂?媛???щ같 ?깅줉 (farmer_estimated_yield 媛믪쓣 ?듯빐 鍮꾩쑉 議곗젅)
    
    -- [踰? ?섍툒 ?곸젙 (紐⑺몴 ?鍮???91%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'RICE' LIMIT 1), 3000.0, 21000.0, '??, 'ACTIVE');

    -- [?좊쭏?? 怨듦툒 怨쇱엵 寃쎄퀬 (紐⑺몴 ?鍮???180%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'TOMATO' LIMIT 1), 500.0, 130.0, '??, 'ACTIVE');

    -- [媛먯옄] 怨듦툒 怨쇱엵 二쇱쓽 (紐⑺몴 ?鍮???116%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'POTATO' LIMIT 1), 800.0, 8500.0, '??, 'ACTIVE');

    -- [肄? 怨듦툒 遺議?二쇱쓽 (紐⑺몴 ?鍮???52%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'SOYBEAN' LIMIT 1), 400.0, 400.0, '??, 'ACTIVE');

    -- [諛⑹슱?좊쭏?? 怨듦툒 遺議?寃쎄퀬 (紐⑺몴 ?鍮???13%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'CHERRY_TOMATO' LIMIT 1), 100.0, 5.0, '??, 'ACTIVE');

END $$;
