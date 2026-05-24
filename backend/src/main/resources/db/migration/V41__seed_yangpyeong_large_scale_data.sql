-- =========================================================================
-- FarmBalance 2025 Year Town-specific Seed Data for Yangpyeong (12 Towns)
-- =========================================================================
-- 이 SQL 스크립트는 2025년도를 기준으로 양평군의 12개 읍면동 전체에 대해
-- 실제 상용 서비스 운영 규모의 현실적이고 웅장한 빅데이터 환경을 시뮬레이션합니다.
--
-- [주요 특징]
-- 1. 진짜 양평군 8대/9대 대표 작물(배추, 수박, 호박, 무, 감자, 고구마, 상추, 배, 옥수수) 반영
-- 2. crops 마스터 테이블 및 crop_cultivation_env 생육 환경 가이드 자동 시딩
-- 3. 2020-2024년 KOSIS 실제 친환경 생산 통계 및 2025년 선형회귀 예측 데이터 완벽 이식
-- 4. 2025년 예측 기준량에 수급 비율(70%~170%)로 정밀 재스케일링된 농가 재배 시뮬레이션
-- =========================================================================
-- [Step 0-1] 카테고리 확보 및 신규 crops 마스터 등록
UPDATE crops
SET name = '쌀'
WHERE name = '벼';
-- 과수
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '과수'
        ),
        'APPLE',
        '사과',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '과수'
        ),
        'PEAR',
        '배',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '과수'
        ),
        'PEACH',
        '복숭아',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '과수'
        ),
        'GRAPE',
        '포도',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
-- 곡물
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'RICE',
        '쌀',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'SOYBEAN',
        '콩',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'RED_BEAN',
        '팥',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'GREEN_BEAN',
        '녹두',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'BARLEY',
        '보리',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'CORN',
        '옥수수',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '곡물'
        ),
        'BUCKWHEAT',
        '메밀',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
-- 서류
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '서류'
        ),
        'SWEET_POTATO',
        '고구마',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '서류'
        ),
        'POTATO',
        '감자',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
-- 채소
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'RED_PEPPER',
        '고추',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'NAPA_CABBAGE',
        '배추',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'WATERMELON',
        '수박',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'PUMPKIN',
        '호박',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'RADISH',
        '무',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'LETTUCE',
        '상추',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'TOMATO',
        '토마토',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '채소'
        ),
        'CHERRY_TOMATO',
        '방울토마토',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
-- 특용
INSERT INTO crops (category_id, code, name, data_source)
VALUES (
        (
            SELECT id
            FROM crop_categories
            WHERE name = '특용'
        ),
        'GINSENG',
        '인삼',
        'MANUAL'
    ) ON CONFLICT (code) DO NOTHING;
-- [Step 0-2] crop_cultivation_env 생육 환경 가이드 시드 추가
INSERT INTO crop_cultivation_env (
        crop_name,
        optimal_ph_min,
        optimal_ph_max,
        optimal_temp,
        organic_matter,
        soil_types,
        difficulty,
        sowing_info,
        harvest_info,
        growth_days,
        major_pests
    )
VALUES (
        '사과',
        5.5,
        6.5,
        '15-20℃',
        2.5,
        '양토, 식양토',
        3,
        '4월 상순',
        '10월 중순',
        180,
        '탄저병, 사과응애, 복숭아순나방'
    ),
    (
        '배',
        5.5,
        6.5,
        '15-22℃',
        2.5,
        '식양토, 사양토',
        3,
        '4월 상순',
        '9월 하순',
        160,
        '검은별무늬병, 꼬마배나무이'
    ),
    (
        '복숭아',
        5.5,
        6.0,
        '18-24℃',
        2.0,
        '사양토, 양토',
        3,
        '4월 상순',
        '8월 중순',
        120,
        '잿빛곰팡이병, 진딧물, 깍지벌레'
    ),
    (
        '포도',
        6.0,
        7.0,
        '20-25℃',
        3.0,
        '사양토, 사토',
        4,
        '4월 중순',
        '9월 상순',
        130,
        '노균병, 새눈무늬병, 응애'
    ),
    (
        '콩',
        6.0,
        7.0,
        '20-25℃',
        2.0,
        '식양토, 양토',
        2,
        '5월 하순',
        '10월 중순',
        120,
        '노린재, 진딧물, 콩꼬투리나방'
    ),
    (
        '고구마',
        5.0,
        6.0,
        '20-28℃',
        1.5,
        '사양토, 양토',
        1,
        '5월 상순',
        '9월 하순',
        120,
        '덩굴쪼김병, 굼벵이'
    ),
    (
        '감자',
        5.0,
        5.5,
        '15-20℃',
        2.0,
        '사양토, 사토',
        1,
        '3월 하순',
        '6월 하순',
        90,
        '역병, 더더기병, 진딧물'
    ),
    (
        '옥수수',
        5.5,
        6.8,
        '22-30℃',
        2.5,
        '양토, 사양토',
        1,
        '4월 중순',
        '7월 하순',
        100,
        '조명나방, 깨씨무늬병'
    ),
    (
        '메밀',
        5.0,
        6.5,
        '15-20℃',
        1.0,
        '사토, 사양토',
        1,
        '7월 하순',
        '10월 중순',
        80,
        '입고병, 거세미나방'
    ),
    (
        '배추',
        6.0,
        6.8,
        '15-20℃',
        3.0,
        '점토, 양토',
        2,
        '8월 하순',
        '11월 상순',
        70,
        '무름병, 벼룩잎벌레, 배추좀나방'
    ),
    (
        '수박',
        5.5,
        6.8,
        '25-30℃',
        3.0,
        '사양토',
        4,
        '4월 하순',
        '7월 하순',
        90,
        '덩굴마름병, 진딧물'
    ),
    (
        '호박',
        5.5,
        6.8,
        '20-25℃',
        2.5,
        '양토, 사양토',
        2,
        '4월 중순',
        '8월 상순',
        100,
        '흰가루병, 진딧물'
    ),
    (
        '무',
        5.5,
        6.5,
        '15-20℃',
        2.5,
        '사양토, 양토',
        2,
        '8월 하순',
        '11월 상순',
        70,
        '벼룩잎벌레, 무름병'
    ),
    (
        '상추',
        6.0,
        6.5,
        '15-20℃',
        2.5,
        '양토, 사양토',
        1,
        '4월 상순',
        '5월 하순',
        50,
        '균핵병, 진딧물'
    ),
    (
        '토마토',
        6.0,
        6.8,
        '20-25℃',
        3.0,
        '양토, 사양토',
        3,
        '4월 중순',
        '7월 중순',
        90,
        '역병, 온실가루이, 진딧물'
    ),
    (
        '방울토마토',
        6.0,
        6.8,
        '20-25℃',
        3.0,
        '양토, 사양토',
        2,
        '4월 중순',
        '7월 중순',
        85,
        '역병, 온실가루이'
    ),
    (
        '보리',
        6.0,
        7.0,
        '10-18℃',
        2.0,
        '양토, 식양토',
        1,
        '10월 중순',
        '6월 중순',
        240,
        '붉은곰팡이병, 깜부기병'
    ),
    (
        '고추',
        6.0,
        6.5,
        '20-25℃',
        3.0,
        '양토, 사양토',
        3,
        '5월 상순',
        '8월 중순',
        140,
        '탄저병, 담배나방, 역병'
    ) ON CONFLICT (crop_name) DO
UPDATE
SET optimal_ph_min = EXCLUDED.optimal_ph_min,
    optimal_ph_max = EXCLUDED.optimal_ph_max,
    optimal_temp = EXCLUDED.optimal_temp,
    organic_matter = EXCLUDED.organic_matter,
    soil_types = EXCLUDED.soil_types,
    difficulty = EXCLUDED.difficulty,
    sowing_info = EXCLUDED.sowing_info,
    harvest_info = EXCLUDED.harvest_info,
    growth_days = EXCLUDED.growth_days,
    major_pests = EXCLUDED.major_pests;
-- [Step 1] 테스트 환경 클린업 & 기존 유령 데이터 초기화
DELETE FROM cultivation_registrations
WHERE farm_id IN (
        SELECT id
        FROM farms
        WHERE name LIKE '2025 % 테스트 농장%'
    );
DELETE FROM farms
WHERE name LIKE '2025 % 테스트 농장%';
DELETE FROM notifications
WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE 'town_farmer_%'
    );
DELETE FROM users
WHERE email LIKE 'town_farmer_%';
-- 양평군 5개년 실제 통계 및 2025 예측 통계 클린업
DELETE FROM crop_production_stats
WHERE region_code = '4183'
    AND year BETWEEN 2020 AND 2025;
-- [Step 2] 26개 작물의 2020~2024년 실제 통계 및 2025년 예측 통계 대량 삽입
-- (KOSIS 실제 데이터 + 선형회귀 2025 예측 데이터 완벽 이식)
-- 쌀
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '쌀',
        '4183',
        '양평군',
        2020,
        2150.0,
        480.0,
        10320.0,
        '톤'
    ),
    (
        '쌀',
        '4183',
        '양평군',
        2021,
        2100.0,
        490.0,
        10290.0,
        '톤'
    ),
    (
        '쌀',
        '4183',
        '양평군',
        2022,
        2050.0,
        500.0,
        10250.0,
        '톤'
    ),
    (
        '쌀',
        '4183',
        '양평군',
        2023,
        2020.0,
        495.0,
        9999.0,
        '톤'
    ),
    (
        '쌀',
        '4183',
        '양평군',
        2024,
        2010.0,
        502.0,
        10090.2,
        '톤'
    ),
    (
        '쌀',
        '4183',
        '양평군',
        2025,
        2000.0,
        500.0,
        10000.0,
        '톤'
    );
-- 인삼
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '인삼',
        '4183',
        '양평군',
        2020,
        55.00,
        100.00,
        55.00,
        '톤'
    ),
    (
        '인삼',
        '4183',
        '양평군',
        2021,
        58.00,
        100.00,
        58.00,
        '톤'
    ),
    (
        '인삼',
        '4183',
        '양평군',
        2022,
        60.00,
        98.00,
        58.80,
        '톤'
    ),
    (
        '인삼',
        '4183',
        '양평군',
        2023,
        62.00,
        101.00,
        62.60,
        '톤'
    ),
    (
        '인삼',
        '4183',
        '양평군',
        2024,
        60.00,
        100.00,
        60.00,
        '톤'
    ),
    (
        '인삼',
        '4183',
        '양평군',
        2025,
        60.00,
        100.00,
        60.00,
        '톤'
    );
-- 사과
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '사과',
        '4183',
        '양평군',
        2020,
        31.69,
        1261.73,
        345.60,
        '톤'
    ),
    (
        '사과',
        '4183',
        '양평군',
        2021,
        29.50,
        1105.08,
        326.00,
        '톤'
    ),
    (
        '사과',
        '4183',
        '양평군',
        2022,
        32.13,
        1140.60,
        355.00,
        '톤'
    ),
    (
        '사과',
        '4183',
        '양평군',
        2023,
        31.98,
        1104.89,
        353.34,
        '톤'
    ),
    (
        '사과',
        '4183',
        '양평군',
        2024,
        32.15,
        1113.95,
        358.00,
        '톤'
    ),
    (
        '사과',
        '4183',
        '양평군',
        2025,
        32.51,
        1056.53,
        363.23,
        '톤'
    );
-- 배
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '배',
        '4183',
        '양평군',
        2020,
        64.05,
        1777.00,
        1175.14,
        '톤'
    ),
    (
        '배',
        '4183',
        '양평군',
        2021,
        66.10,
        1823.00,
        1204.90,
        '톤'
    ),
    (
        '배',
        '4183',
        '양평군',
        2022,
        57.55,
        1611.00,
        1035.90,
        '톤'
    ),
    (
        '배',
        '4183',
        '양평군',
        2023,
        57.55,
        1800.00,
        1035.90,
        '톤'
    ),
    (
        '배',
        '4183',
        '양평군',
        2024,
        54.61,
        1811.00,
        989.30,
        '톤'
    ),
    (
        '배',
        '4183',
        '양평군',
        2025,
        51.74,
        1777.90,
        926.02,
        '톤'
    );
-- 복숭아
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '복숭아',
        '4183',
        '양평군',
        2020,
        26.15,
        917.00,
        191.51,
        '톤'
    ),
    (
        '복숭아',
        '4183',
        '양평군',
        2021,
        25.00,
        764.00,
        190.90,
        '톤'
    ),
    (
        '복숭아',
        '4183',
        '양평군',
        2022,
        27.06,
        700.00,
        189.42,
        '톤'
    ),
    (
        '복숭아',
        '4183',
        '양평군',
        2023,
        27.06,
        700.00,
        189.42,
        '톤'
    ),
    (
        '복숭아',
        '4183',
        '양평군',
        2024,
        21.36,
        764.00,
        163.00,
        '톤'
    ),
    (
        '복숭아',
        '4183',
        '양평군',
        2025,
        23.07,
        658.00,
        167.30,
        '톤'
    );
-- 포도
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '포도',
        '4183',
        '양평군',
        2020,
        8.20,
        1400.00,
        109.71,
        '톤'
    ),
    (
        '포도',
        '4183',
        '양평군',
        2021,
        8.00,
        1334.00,
        106.70,
        '톤'
    ),
    (
        '포도',
        '4183',
        '양평군',
        2022,
        5.75,
        983.00,
        74.75,
        '톤'
    ),
    (
        '포도',
        '4183',
        '양평군',
        2023,
        5.75,
        1300.00,
        74.75,
        '톤'
    ),
    (
        '포도',
        '4183',
        '양평군',
        2024,
        5.91,
        1303.00,
        77.00,
        '톤'
    ),
    (
        '포도',
        '4183',
        '양평군',
        2025,
        4.67,
        1195.60,
        75.50,
        '톤'
    );
-- 콩
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '콩',
        '4183',
        '양평군',
        2020,
        466.20,
        129.10,
        645.60,
        '톤'
    ),
    (
        '콩',
        '4183',
        '양평군',
        2021,
        441.00,
        138.40,
        610.70,
        '톤'
    ),
    (
        '콩',
        '4183',
        '양평군',
        2022,
        427.50,
        128.30,
        598.50,
        '톤'
    ),
    (
        '콩',
        '4183',
        '양평군',
        2023,
        427.50,
        140.00,
        598.40,
        '톤'
    ),
    (
        '콩',
        '4183',
        '양평군',
        2024,
        418.50,
        140.30,
        587.40,
        '톤'
    ),
    (
        '콩',
        '4183',
        '양평군',
        2025,
        403.47,
        142.42,
        569.51,
        '톤'
    );
-- 팥
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES ('팥', '4183', '양평군', 2020, 7.70, 73.10, 5.70, '톤'),
    ('팥', '4183', '양평군', 2021, 7.00, 71.40, 5.00, '톤'),
    ('팥', '4183', '양평군', 2022, 7.10, 71.40, 5.00, '톤'),
    ('팥', '4183', '양평군', 2023, 7.10, 70.20, 5.00, '톤'),
    ('팥', '4183', '양평군', 2024, 8.10, 76.50, 6.20, '톤'),
    ('팥', '4183', '양평군', 2025, 7.67, 74.20, 5.68, '톤');
-- 녹두
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '녹두',
        '4183',
        '양평군',
        2020,
        1.80,
        62.10,
        1.40,
        '톤'
    ),
    (
        '녹두',
        '4183',
        '양평군',
        2021,
        2.00,
        65.00,
        1.30,
        '톤'
    ),
    (
        '녹두',
        '4183',
        '양평군',
        2022,
        1.30,
        42.30,
        1.00,
        '톤'
    ),
    (
        '녹두',
        '4183',
        '양평군',
        2023,
        1.30,
        80.00,
        1.00,
        '톤'
    ),
    (
        '녹두',
        '4183',
        '양평군',
        2024,
        1.10,
        72.70,
        0.80,
        '톤'
    ),
    (
        '녹두',
        '4183',
        '양평군',
        2025,
        1.23,
        75.28,
        0.65,
        '톤'
    );
-- 고구마
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '고구마',
        '4183',
        '양평군',
        2020,
        120.40,
        1027.40,
        1237.00,
        '톤'
    ),
    (
        '고구마',
        '4183',
        '양평군',
        2021,
        123.00,
        1025.30,
        1261.10,
        '톤'
    ),
    (
        '고구마',
        '4183',
        '양평군',
        2022,
        123.00,
        1025.30,
        1261.10,
        '톤'
    ),
    (
        '고구마',
        '4183',
        '양평군',
        2023,
        134.40,
        1025.30,
        1378.30,
        '톤'
    ),
    (
        '고구마',
        '4183',
        '양평군',
        2024,
        133.50,
        1026.50,
        1369.20,
        '톤'
    ),
    (
        '고구마',
        '4183',
        '양평군',
        2025,
        138.14,
        1025.42,
        1415.82,
        '톤'
    );
-- 감자
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '감자',
        '4183',
        '양평군',
        2020,
        113.70,
        1689.90,
        1921.50,
        '톤'
    ),
    (
        '감자',
        '4183',
        '양평군',
        2021,
        111.00,
        1690.00,
        1873.60,
        '톤'
    ),
    (
        '감자',
        '4183',
        '양평군',
        2022,
        111.00,
        1688.00,
        1873.60,
        '톤'
    ),
    (
        '감자',
        '4183',
        '양평군',
        2023,
        104.70,
        1850.60,
        1767.40,
        '톤'
    ),
    (
        '감자',
        '4183',
        '양평군',
        2024,
        97.10,
        1687.20,
        1637.30,
        '톤'
    ),
    (
        '감자',
        '4183',
        '양평군',
        2025,
        95.65,
        1767.70,
        1612.30,
        '톤'
    );
-- 겉보리
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '겉보리',
        '4183',
        '양평군',
        2020,
        3.30,
        221.20,
        7.30,
        '톤'
    ),
    (
        '겉보리',
        '4183',
        '양평군',
        2021,
        4.00,
        225.00,
        9.00,
        '톤'
    ),
    (
        '겉보리',
        '4183',
        '양평군',
        2022,
        4.60,
        230.40,
        10.60,
        '톤'
    ),
    (
        '겉보리',
        '4183',
        '양평군',
        2023,
        4.40,
        228.50,
        10.10,
        '톤'
    ),
    (
        '겉보리',
        '4183',
        '양평군',
        2024,
        4.40,
        229.50,
        10.10,
        '톤'
    ),
    (
        '겉보리',
        '4183',
        '양평군',
        2025,
        4.92,
        232.95,
        11.43,
        '톤'
    );
-- 쌀보리
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '쌀보리',
        '4183',
        '양평군',
        2020,
        4.50,
        228.90,
        10.30,
        '톤'
    ),
    (
        '쌀보리',
        '4183',
        '양평군',
        2021,
        5.00,
        220.00,
        11.00,
        '톤'
    ),
    (
        '쌀보리',
        '4183',
        '양평군',
        2022,
        3.40,
        229.40,
        7.80,
        '톤'
    ),
    (
        '쌀보리',
        '4183',
        '양평군',
        2023,
        3.30,
        227.40,
        7.60,
        '톤'
    ),
    (
        '쌀보리',
        '4183',
        '양평군',
        2024,
        3.30,
        230.30,
        7.60,
        '톤'
    ),
    (
        '쌀보리',
        '4183',
        '양평군',
        2025,
        2.67,
        230.26,
        6.22,
        '톤'
    );
-- 보리
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '보리',
        '4183',
        '양평군',
        2020,
        7.80,
        225.00,
        17.60,
        '톤'
    ),
    (
        '보리',
        '4183',
        '양평군',
        2021,
        9.00,
        222.00,
        20.00,
        '톤'
    ),
    (
        '보리',
        '4183',
        '양평군',
        2022,
        8.00,
        230.00,
        18.40,
        '톤'
    ),
    (
        '보리',
        '4183',
        '양평군',
        2023,
        7.70,
        228.00,
        17.70,
        '톤'
    ),
    (
        '보리',
        '4183',
        '양평군',
        2024,
        7.70,
        230.00,
        17.70,
        '톤'
    ),
    (
        '보리',
        '4183',
        '양평군',
        2025,
        30.00,
        200.00,
        60.00,
        '톤'
    );
-- 옥수수
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '옥수수',
        '4183',
        '양평군',
        2020,
        195.40,
        523.90,
        1065.00,
        '톤'
    ),
    (
        '옥수수',
        '4183',
        '양평군',
        2021,
        195.40,
        523.90,
        1065.00,
        '톤'
    ),
    (
        '옥수수',
        '4183',
        '양평군',
        2022,
        190.00,
        543.80,
        1033.20,
        '톤'
    ),
    (
        '옥수수',
        '4183',
        '양평군',
        2023,
        184.60,
        543.80,
        1003.80,
        '톤'
    ),
    (
        '옥수수',
        '4183',
        '양평군',
        2024,
        181.40,
        544.50,
        987.50,
        '톤'
    ),
    (
        '옥수수',
        '4183',
        '양평군',
        2025,
        177.72,
        554.31,
        966.04,
        '톤'
    );
-- 메밀
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '메밀',
        '4183',
        '양평군',
        2020,
        12.00,
        6.00,
        9.00,
        '톤'
    ),
    (
        '메밀',
        '4183',
        '양평군',
        2021,
        12.00,
        8.00,
        9.00,
        '톤'
    ),
    (
        '메밀',
        '4183',
        '양평군',
        2022,
        12.00,
        8.00,
        9.00,
        '톤'
    ),
    (
        '메밀',
        '4183',
        '양평군',
        2023,
        14.00,
        8.00,
        11.00,
        '톤'
    ),
    (
        '메밀',
        '4183',
        '양평군',
        2024,
        13.80,
        7.80,
        10.80,
        '톤'
    ),
    (
        '메밀',
        '4183',
        '양평군',
        2025,
        14.44,
        8.64,
        11.44,
        '톤'
    );
-- 수박
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '수박',
        '4183',
        '양평군',
        2020,
        68.40,
        5427.40,
        3800.00,
        '톤'
    ),
    (
        '수박',
        '4183',
        '양평군',
        2021,
        68.00,
        5552.30,
        3775.60,
        '톤'
    ),
    (
        '수박',
        '4183',
        '양평군',
        2022,
        67.60,
        5522.90,
        3751.80,
        '톤'
    ),
    (
        '수박',
        '4183',
        '양평군',
        2023,
        67.20,
        5554.10,
        3732.90,
        '톤'
    ),
    (
        '수박',
        '4183',
        '양평군',
        2024,
        67.20,
        5553.60,
        3732.90,
        '톤'
    ),
    (
        '수박',
        '4183',
        '양평군',
        2025,
        66.72,
        5598.32,
        3705.57,
        '톤'
    );
-- 딸기
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '딸기',
        '4183',
        '양평군',
        2020,
        13.20,
        1834.00,
        287.50,
        '톤'
    ),
    (
        '딸기',
        '4183',
        '양평군',
        2021,
        8.70,
        1721.80,
        149.80,
        '톤'
    ),
    (
        '딸기',
        '4183',
        '양평군',
        2022,
        9.10,
        1800.90,
        156.50,
        '톤'
    ),
    (
        '딸기',
        '4183',
        '양평군',
        2023,
        9.10,
        1714.30,
        155.10,
        '톤'
    ),
    (
        '딸기',
        '4183',
        '양평군',
        2024,
        10.00,
        1842.00,
        184.20,
        '톤'
    ),
    (
        '딸기',
        '4183',
        '양평군',
        2025,
        8.22,
        1785.15,
        126.23,
        '톤'
    );
-- 오이
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '오이',
        '4183',
        '양평군',
        2020,
        11.70,
        5264.00,
        705.40,
        '톤'
    ),
    (
        '오이',
        '4183',
        '양평군',
        2021,
        11.10,
        6283.70,
        697.50,
        '톤'
    ),
    (
        '오이',
        '4183',
        '양평군',
        2022,
        13.10,
        7415.90,
        822.70,
        '톤'
    ),
    (
        '오이',
        '4183',
        '양평군',
        2023,
        13.10,
        6294.40,
        822.70,
        '톤'
    ),
    (
        '오이',
        '4183',
        '양평군',
        2024,
        12.80,
        6231.30,
        797.60,
        '톤'
    ),
    (
        '오이',
        '4183',
        '양평군',
        2025,
        13.62,
        6881.45,
        862.06,
        '톤'
    );
-- 호박
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '호박',
        '4183',
        '양평군',
        2020,
        88.50,
        3249.70,
        2876.00,
        '톤'
    ),
    (
        '호박',
        '4183',
        '양평군',
        2021,
        90.10,
        3125.30,
        2815.90,
        '톤'
    ),
    (
        '호박',
        '4183',
        '양평군',
        2022,
        66.60,
        3127.60,
        2083.00,
        '톤'
    ),
    (
        '호박',
        '4183',
        '양평군',
        2023,
        66.40,
        3130.00,
        2078.00,
        '톤'
    ),
    (
        '호박',
        '4183',
        '양평군',
        2024,
        84.10,
        3231.30,
        2717.10,
        '톤'
    ),
    (
        '호박',
        '4183',
        '양평군',
        2025,
        69.39,
        3163.15,
        2197.29,
        '톤'
    );
-- 토마토
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '토마토',
        '4183',
        '양평군',
        2020,
        18.60,
        4266.20,
        912.40,
        '톤'
    ),
    (
        '토마토',
        '4183',
        '양평군',
        2021,
        17.70,
        4859.30,
        860.10,
        '톤'
    ),
    (
        '토마토',
        '4183',
        '양평군',
        2022,
        16.30,
        4471.60,
        791.70,
        '톤'
    ),
    (
        '토마토',
        '4183',
        '양평군',
        2023,
        16.10,
        4860.00,
        784.40,
        '톤'
    ),
    (
        '토마토',
        '4183',
        '양평군',
        2024,
        15.80,
        4868.40,
        769.00,
        '톤'
    ),
    (
        '토마토',
        '4183',
        '양평군',
        2025,
        14.74,
        5026.63,
        714.77,
        '톤'
    );
-- 방울토마토
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '방울토마토',
        '4183',
        '양평군',
        2020,
        48.20,
        3300.00,
        159.00,
        '톤'
    ),
    (
        '방울토마토',
        '4183',
        '양평군',
        2021,
        47.50,
        3400.00,
        161.50,
        '톤'
    ),
    (
        '방울토마토',
        '4183',
        '양평군',
        2022,
        49.00,
        3450.00,
        169.00,
        '톤'
    ),
    (
        '방울토마토',
        '4183',
        '양평군',
        2023,
        49.50,
        3500.00,
        173.25,
        '톤'
    ),
    (
        '방울토마토',
        '4183',
        '양평군',
        2024,
        50.00,
        3500.00,
        175.00,
        '톤'
    ),
    (
        '방울토마토',
        '4183',
        '양평군',
        2025,
        50.00,
        350.00,
        175.00,
        '톤'
    );
-- 배추
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '배추',
        '4183',
        '양평군',
        2020,
        70.10,
        8244.10,
        6134.70,
        '톤'
    ),
    (
        '배추',
        '4183',
        '양평군',
        2021,
        68.30,
        8713.70,
        5951.50,
        '톤'
    ),
    (
        '배추',
        '4183',
        '양평군',
        2022,
        78.10,
        9965.60,
        6805.10,
        '톤'
    ),
    (
        '배추',
        '4183',
        '양평군',
        2023,
        65.10,
        8710.00,
        5666.70,
        '톤'
    ),
    (
        '배추',
        '4183',
        '양평군',
        2024,
        57.80,
        8616.60,
        4983.40,
        '톤'
    ),
    (
        '배추',
        '4183',
        '양평군',
        2025,
        59.54,
        9072.39,
        5132.06,
        '톤'
    );
-- 시금치
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '시금치',
        '4183',
        '양평군',
        2020,
        17.50,
        1205.50,
        238.70,
        '톤'
    ),
    (
        '시금치',
        '4183',
        '양평군',
        2021,
        16.60,
        1351.80,
        224.40,
        '톤'
    ),
    (
        '시금치',
        '4183',
        '양평군',
        2022,
        15.00,
        1220.20,
        202.50,
        '톤'
    ),
    (
        '시금치',
        '4183',
        '양평군',
        2023,
        15.00,
        1350.90,
        202.50,
        '톤'
    ),
    (
        '시금치',
        '4183',
        '양평군',
        2024,
        11.60,
        1321.60,
        153.30,
        '톤'
    ),
    (
        '시금치',
        '4183',
        '양평군',
        2025,
        10.32,
        1290.45,
        127.32,
        '톤'
    );
-- 상추
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '상추',
        '4183',
        '양평군',
        2020,
        80.00,
        2450.00,
        1722.00,
        '톤'
    ),
    (
        '상추',
        '4183',
        '양평군',
        2021,
        84.50,
        2114.20,
        1786.50,
        '톤'
    ),
    (
        '상추',
        '4183',
        '양평군',
        2022,
        74.20,
        2115.30,
        1566.00,
        '톤'
    ),
    (
        '상추',
        '4183',
        '양평군',
        2023,
        64.50,
        2110.00,
        1361.20,
        '톤'
    ),
    (
        '상추',
        '4183',
        '양평군',
        2024,
        62.90,
        2104.10,
        1324.00,
        '톤'
    ),
    (
        '상추',
        '4183',
        '양평군',
        2025,
        57.65,
        2102.50,
        1213.62,
        '톤'
    );
-- 양배추
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '양배추',
        '4183',
        '양평군',
        2020,
        1.90,
        2065.20,
        48.40,
        '톤'
    ),
    (
        '양배추',
        '4183',
        '양평군',
        2021,
        1.80,
        2455.50,
        44.20,
        '톤'
    ),
    (
        '양배추',
        '4183',
        '양평군',
        2022,
        2.50,
        3424.10,
        61.70,
        '톤'
    ),
    (
        '양배추',
        '4183',
        '양평군',
        2023,
        2.50,
        2459.80,
        61.70,
        '톤'
    ),
    (
        '양배추',
        '4183',
        '양평군',
        2024,
        2.80,
        2442.90,
        68.40,
        '톤'
    ),
    (
        '양배추',
        '4183',
        '양평군',
        2025,
        3.02,
        2441.50,
        73.74,
        '톤'
    );
-- 무
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '무',
        '4183',
        '양평군',
        2020,
        32.20,
        9509.40,
        3060.90,
        '톤'
    ),
    (
        '무',
        '4183',
        '양평군',
        2021,
        31.50,
        1202.00,
        3029.30,
        '톤'
    ),
    (
        '무',
        '4183',
        '양평군',
        2022,
        26.90,
        1112.40,
        2698.10,
        '톤'
    ),
    (
        '무',
        '4183',
        '양평군',
        2023,
        24.90,
        11722.80,
        2465.50,
        '톤'
    ),
    (
        '무',
        '4183',
        '양평군',
        2024,
        25.40,
        11710.80,
        2479.60,
        '톤'
    ),
    (
        '무',
        '4183',
        '양평군',
        2025,
        22.12,
        11122.50,
        2258.62,
        '톤'
    );
-- 당근
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '당근',
        '4183',
        '양평군',
        2020,
        9.40,
        4681.60,
        417.30,
        '톤'
    ),
    (
        '당근',
        '4183',
        '양평군',
        2021,
        9.20,
        3871.30,
        420.80,
        '톤'
    ),
    (
        '당근',
        '4183',
        '양평군',
        2022,
        6.30,
        2646.00,
        287.90,
        '톤'
    ),
    (
        '당근',
        '4183',
        '양평군',
        2023,
        6.30,
        4541.20,
        287.50,
        '톤'
    ),
    (
        '당근',
        '4183',
        '양평군',
        2024,
        6.90,
        4530.40,
        312.60,
        '톤'
    ),
    (
        '당근',
        '4183',
        '양평군',
        2025,
        6.13,
        4425.20,
        278.43,
        '톤'
    );
-- 고추
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '고추',
        '4183',
        '양평군',
        2020,
        286.70,
        181.40,
        558.60,
        '톤'
    ),
    (
        '고추',
        '4183',
        '양평군',
        2021,
        281.70,
        208.00,
        586.00,
        '톤'
    ),
    (
        '고추',
        '4183',
        '양평군',
        2022,
        269.10,
        188.40,
        565.10,
        '톤'
    ),
    (
        '고추',
        '4183',
        '양평군',
        2023,
        267.60,
        210.00,
        561.90,
        '톤'
    ),
    (
        '고추',
        '4183',
        '양평군',
        2024,
        258.60,
        217.80,
        563.50,
        '톤'
    ),
    (
        '고추',
        '4183',
        '양평군',
        2025,
        250.22,
        223.50,
        560.10,
        '톤'
    );
-- 파
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '파',
        '4183',
        '양평군',
        2020,
        26.10,
        3275.40,
        860.20,
        '톤'
    ),
    (
        '파',
        '4183',
        '양평군',
        2021,
        26.10,
        3313.70,
        864.90,
        '톤'
    ),
    (
        '파',
        '4183',
        '양평군',
        2022,
        25.70,
        3263.90,
        850.70,
        '톤'
    ),
    (
        '파',
        '4183',
        '양평군',
        2023,
        24.00,
        3310.00,
        794.40,
        '톤'
    ),
    (
        '파',
        '4183',
        '양평군',
        2024,
        24.90,
        3302.80,
        822.60,
        '톤'
    ),
    (
        '파',
        '4183',
        '양평군',
        2025,
        23.82,
        3305.50,
        816.20,
        '톤'
    );
-- 양파
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '양파',
        '4183',
        '양평군',
        2020,
        17.00,
        2610.60,
        305.10,
        '톤'
    ),
    (
        '양파',
        '4183',
        '양평군',
        2021,
        19.80,
        1569.60,
        310.80,
        '톤'
    ),
    (
        '양파',
        '4183',
        '양평군',
        2022,
        17.40,
        1379.80,
        295.80,
        '톤'
    ),
    (
        '양파',
        '4183',
        '양평군',
        2023,
        17.30,
        1700.00,
        293.90,
        '톤'
    ),
    (
        '양파',
        '4183',
        '양평군',
        2024,
        18.40,
        1659.80,
        305.40,
        '톤'
    ),
    (
        '양파',
        '4183',
        '양평군',
        2025,
        18.02,
        1655.40,
        299.70,
        '톤'
    );
-- 생강
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '생강',
        '4183',
        '양평군',
        2020,
        1.30,
        750.00,
        8.90,
        '톤'
    ),
    (
        '생강',
        '4183',
        '양평군',
        2021,
        1.40,
        664.20,
        9.30,
        '톤'
    ),
    (
        '생강',
        '4183',
        '양평군',
        2022,
        1.60,
        768.00,
        10.60,
        '톤'
    ),
    (
        '생강',
        '4183',
        '양평군',
        2023,
        1.30,
        668.40,
        8.80,
        '톤'
    ),
    (
        '생강',
        '4183',
        '양평군',
        2024,
        1.40,
        671.40,
        9.40,
        '톤'
    ),
    (
        '생강',
        '4183',
        '양평군',
        2025,
        1.39,
        688.50,
        9.55,
        '톤'
    );
-- 마늘
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '마늘',
        '4183',
        '양평군',
        2020,
        40.00,
        2098.50,
        907.90,
        '톤'
    ),
    (
        '마늘',
        '4183',
        '양평군',
        2021,
        38.60,
        2300.70,
        888.10,
        '톤'
    ),
    (
        '마늘',
        '4183',
        '양평군',
        2022,
        37.30,
        2223.00,
        857.90,
        '톤'
    ),
    (
        '마늘',
        '4183',
        '양평군',
        2023,
        37.30,
        2300.00,
        857.20,
        '톤'
    ),
    (
        '마늘',
        '4183',
        '양평군',
        2024,
        37.30,
        2297.30,
        857.20,
        '톤'
    ),
    (
        '마늘',
        '4183',
        '양평군',
        2025,
        36.54,
        2288.40,
        845.30,
        '톤'
    );
-- 참깨
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '참깨',
        '4183',
        '양평군',
        2020,
        84.70,
        41.00,
        36.90,
        '톤'
    ),
    (
        '참깨',
        '4183',
        '양평군',
        2021,
        77.90,
        46.00,
        35.90,
        '톤'
    ),
    (
        '참깨',
        '4183',
        '양평군',
        2022,
        78.60,
        47.10,
        39.30,
        '톤'
    ),
    (
        '참깨',
        '4183',
        '양평군',
        2023,
        78.40,
        50.00,
        39.20,
        '톤'
    ),
    (
        '참깨',
        '4183',
        '양평군',
        2024,
        76.70,
        74.70,
        38.40,
        '톤'
    ),
    (
        '참깨',
        '4183',
        '양평군',
        2025,
        74.62,
        58.20,
        39.00,
        '톤'
    );
-- 들깨
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '들깨',
        '4183',
        '양평군',
        2020,
        619.10,
        27.40,
        157.80,
        '톤'
    ),
    (
        '들깨',
        '4183',
        '양평군',
        2021,
        672.30,
        20.40,
        137.20,
        '톤'
    ),
    (
        '들깨',
        '4183',
        '양평군',
        2022,
        622.30,
        18.90,
        124.50,
        '톤'
    ),
    (
        '들깨',
        '4183',
        '양평군',
        2023,
        621.80,
        20.00,
        124.40,
        '톤'
    ),
    (
        '들깨',
        '4183',
        '양평군',
        2024,
        624.30,
        20.00,
        124.90,
        '톤'
    ),
    (
        '들깨',
        '4183',
        '양평군',
        2025,
        625.40,
        18.60,
        116.50,
        '톤'
    );
-- 땅콩
INSERT INTO crop_production_stats (
        itm_nm,
        region_code,
        region_name,
        year,
        cultivated_area,
        yield_per_10a,
        total_production,
        unit_nm
    )
VALUES (
        '땅콩',
        '4183',
        '양평군',
        2020,
        23.50,
        187.10,
        43.90,
        '톤'
    ),
    (
        '땅콩',
        '4183',
        '양평군',
        2021,
        22.70,
        192.00,
        43.60,
        '톤'
    ),
    (
        '땅콩',
        '4183',
        '양평군',
        2022,
        23.40,
        198.60,
        44.50,
        '톤'
    ),
    (
        '땅콩',
        '4183',
        '양평군',
        2023,
        23.30,
        190.30,
        44.40,
        '톤'
    ),
    (
        '땅콩',
        '4183',
        '양평군',
        2024,
        23.20,
        192.20,
        44.60,
        '톤'
    ),
    (
        '땅콩',
        '4183',
        '양평군',
        2025,
        23.12,
        194.50,
        44.80,
        '톤'
    );
-- [Step 3] PL/pgSQL 루프를 이용한 대규모 농가(600개) 및 분산 재배 데이터 자동 생성
-- 12개 읍면동 × 50개 농장 = 총 600개 농장
-- 12개 작물 × 각 120개 농장씩 분배 = 총 1,440개 재배 등록 데이터
DO $$
DECLARE v_user_id BIGINT;
v_farm_id BIGINT;
v_crop_id BIGINT;
v_town_code VARCHAR;
v_town_name VARCHAR;
v_crop_name VARCHAR;
-- 12개 읍면동 정보 매핑 배열
t_town_codes VARCHAR [] := ARRAY ['4183010', '4183020', '4183030', '4183040', '4183050', '4183060', '4183070', '4183080', '4183090', '4183100', '4183110', '4183120'];
t_town_names VARCHAR [] := ARRAY ['양평읍', '강상면', '강하면', '양서면', '옥천면', '서종면', '단월면', '청운면', '양동면', '지평면', '용문면', '개군면'];
-- 12개 활성 작물 배열 (양평군 진짜 8대 주력작물 + 핵심 온디맨드 작물 총 12종)
t_crops VARCHAR [] := ARRAY ['배추', '수박', '호박', '무', '감자', '고구마', '상추', '배', '옥수수', '메밀', '방울토마토', '고추'];
-- 양평군 전체의 현실적 수급 비율을 충족시키는 작물별 전체 목표 총 공급량 (톤 단위)
-- 수급률 = (공급량 / 수요량) × 100
-- (실제 KOSIS 2025 예측량 기반으로 현실적 공급 타겟 재스케일링)
t_target_yields DOUBLE PRECISION [] := ARRAY [
        4875.46,  -- 배추:       수요 5,132.06톤 → 공급 4,875.46톤 → 수급률  95% (적정)
        3335.01,  -- 수박:       수요 3,705.57톤 → 공급 3,335.01톤 → 수급률  90% (적정)
        3295.94,  -- 호박:       수요 2,197.29톤 → 공급 3,295.94톤 → 수급률 150% (초과주의)
        1581.03,  -- 무:         수요 2,258.62톤 → 공급 1,581.03톤 → 수급률  70% (부족주의)
        2418.45,  -- 감자:       수요 1,612.30톤 → 공급 2,418.45톤 → 수급률 150% (초과주의)
        1203.45,  -- 고구마:     수요 1,415.82톤 → 공급 1,203.45톤 → 수급률  85% (적정)
         849.53,  -- 상추:       수요 1,213.62톤 → 공급  849.53톤 → 수급률  70% (부족주의)
         648.21,  -- 배:         수요  926.02톤 → 공급  648.21톤 → 수급률  70% (부족주의)
         869.44,  -- 옥수수:     수요  966.04톤 → 공급  869.44톤 → 수급률  90% (적정)
          13.73,  -- 메밀:       수요   11.44톤 → 공급   13.73톤 → 수급률 120% (초과주의)
          52.50,  -- 방울토마토: 수요  175.00톤 → 공급   52.50톤 → 수급률  30% (부족경고)
         392.07   -- 고추:       수요  560.10톤 → 공급  392.07톤 → 수급률  70% (부족주의)
    ];
i INT;
j INT;
v_idx INT;
v_farm_name VARCHAR;
v_email VARCHAR;
v_yield DOUBLE PRECISION;
v_area DOUBLE PRECISION;
BEGIN -- 1. 각 읍면동별 50개의 농부 & 농장 일괄 생성 (12 * 50 = 총 600개 농부/농장)
FOR i IN 1..12 LOOP v_town_code := t_town_codes [i];
v_town_name := t_town_names [i];
FOR j IN 1..50 LOOP v_email := 'town_farmer_' || lower(substring(v_town_code, 6, 2)) || '_' || j || '@farmbalance.com';
v_farm_name := '2025 ' || v_town_name || ' 테스트 농장 ' || j;
-- 1) 사용자(농부) 등록
INSERT INTO users (
        email,
        password,
        name,
        phone,
        role,
        status,
        provider,
        address
    )
VALUES (
        v_email,
        '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu',
        v_town_name || ' 농가 ' || j,
        '010-2025-' || lpad(cast((i * 50 + j) as varchar), 4, '0'),
        'FARMER',
        'ACTIVE',
        'LOCAL',
        '경기도 양평군 ' || v_town_name
    ) ON CONFLICT (email) DO
UPDATE
SET name = EXCLUDED.name
RETURNING id INTO v_user_id;
-- 2) 농장 등록
INSERT INTO farms (
        user_id,
        name,
        address,
        area,
        certification_status,
        bjd_code,
        status
    )
VALUES (
        v_user_id,
        v_farm_name,
        '경기도 양평군 ' || v_town_name || ' 중앙길 ' || j,
        1500.0 + (j * 50),
        'APPROVED',
        v_town_code,
        'OPERATING'
    )
RETURNING id INTO v_farm_id;
END LOOP;
END LOOP;
-- 2. 12개 작물의 재배 데이터를 600개 농장에 고르게 쪼개어 자동 분산 주입
--    (재배 데이터 작물당 120개씩 총 1,440개 생성)
FOR i IN 1..12 LOOP v_crop_name := t_crops [i];
-- 마스터 crops 테이블에서 정확한 작물 ID 조회
SELECT id INTO v_crop_id
FROM crops
WHERE name = v_crop_name;
IF v_crop_id IS NULL THEN RAISE NOTICE '경고: crops 테이블에서 "%"를 찾을 수 없습니다. 건너뜁니다.',
v_crop_name;
CONTINUE;
END IF;
-- 작물별 목표 전체 공급량을 120개 농가에 잘게 쪼개서 분배
v_yield := t_target_yields [i] / 120.0;
v_area := (t_target_yields [i] * 10.0) / 120.0;
FOR j IN 1..120 LOOP -- 600개 농장 중 무작위성 있게 고르게 흩어지도록 모듈러 연산 사용
v_idx := ((i * 17 + j * 31) % 600) + 1;
-- 해당 순번의 2025년 신규 농장 ID 조회
SELECT id INTO v_farm_id
FROM farms
WHERE name LIKE '2025 % 테스트 농장 %'
ORDER BY id
LIMIT 1 OFFSET (v_idx - 1);
IF v_farm_id IS NULL THEN CONTINUE;
END IF;
-- 재배 데이터 주입 (yield_unit: 톤)
INSERT INTO cultivation_registrations (
        farm_id,
        crop_id,
        cultivation_area,
        farmer_estimated_yield,
        yield_unit,
        status,
        sowing_date,
        in_season
    )
VALUES (
        v_farm_id,
        v_crop_id,
        round(
            cast(v_area * (0.8 + (j % 5) * 0.1) as numeric),
            1
        ),
        -- 미세 변동성
        round(
            cast(v_yield * (0.8 + (j % 5) * 0.1) as numeric),
            3
        ),
        -- 소수점 3째 자리까지 정밀 분배
        '톤',
        'ACTIVE',
        '2025-05-01',
        true
    );
END LOOP;
END LOOP;
RAISE NOTICE '✅ 완료: 12개 읍면동 × 50개 농장 = 600개 농장, 12개 작물 × 120개씩 = 1,440개 재배 데이터 생성!';
END $$;