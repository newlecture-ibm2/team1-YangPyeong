-- ═══════════════════════════════════════════════════════════════
-- V30: 작물별 재배 환경 정보 테이블 생성 및 시드 데이터
--
-- 목적: AI 추천 엔진에서 하드코딩된 pH, 온도, 난이도 등을
--       실제 DB 값으로 대체하기 위한 작물별 재배 환경 매핑 테이블
--
-- 데이터 출처: 농사로(nongsaro), 농촌진흥청 재배 기술 자료
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crop_cultivation_env (
    id              BIGSERIAL    PRIMARY KEY,
    crop_name       VARCHAR(50)  NOT NULL UNIQUE,  -- crops 테이블의 name과 매칭
    optimal_ph_min  DECIMAL(3,1),                  -- 최적 pH 하한
    optimal_ph_max  DECIMAL(3,1),                  -- 최적 pH 상한
    optimal_temp    VARCHAR(30),                   -- 최적 생육 온도 (예: "20~30°C")
    organic_matter  DECIMAL(5,1),                  -- 적정 유기물 함량 (g/kg)
    soil_types      TEXT,                          -- 선호 토양 (쉼표 구분, 예: "양토,사양토")
    difficulty      INT,                           -- 재배 난이도 (1~5)
    sowing_info     VARCHAR(50),                   -- 파종/정식 시기
    harvest_info    VARCHAR(50),                   -- 수확 시기
    growth_days     INT,                           -- 재배 기간 (일)
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 시드 데이터: 주요 작물별 재배 환경 정보
-- 출처: 농사로 재배기술 길잡이, 농촌진흥청 표준 재배법

-- === 미곡류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('벼', 5.5, 6.5, '20~30°C', 25.0, '식양토,양토', 2, '4월 하순 ~ 5월 상순', '9월 하순 ~ 10월 중순', 150)
ON CONFLICT (crop_name) DO NOTHING;

-- === 맥류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('보리', 6.0, 7.0, '12~18°C', 20.0, '양토,사양토', 2, '10월 상순 ~ 10월 하순', '5월 하순 ~ 6월 중순', 240)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('밀', 6.0, 7.0, '10~20°C', 20.0, '양토,사양토', 2, '10월 중순 ~ 11월 상순', '6월 상순 ~ 6월 하순', 240)
ON CONFLICT (crop_name) DO NOTHING;

-- === 잡곡류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('옥수수', 6.0, 7.0, '20~30°C', 25.0, '양토,사양토', 2, '4월 하순 ~ 5월 상순', '7월 하순 ~ 8월 중순', 90)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('수수', 6.0, 7.0, '25~30°C', 20.0, '양토,사양토', 2, '5월 중순 ~ 6월 상순', '9월 하순 ~ 10월 상순', 120)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('조', 6.0, 7.0, '22~28°C', 20.0, '양토,사양토', 2, '5월 상순 ~ 5월 하순', '9월 상순 ~ 9월 하순', 120)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('메밀', 5.5, 7.0, '18~25°C', 20.0, '양토,사양토', 1, '6월 중순 ~ 7월 상순', '9월 하순 ~ 10월 중순', 75)
ON CONFLICT (crop_name) DO NOTHING;

-- === 두류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('콩', 6.0, 7.0, '20~28°C', 25.0, '양토,식양토', 2, '5월 하순 ~ 6월 중순', '10월 상순 ~ 10월 하순', 130)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('팥', 6.0, 6.5, '20~28°C', 20.0, '양토,사양토', 2, '6월 상순 ~ 6월 하순', '10월 상순 ~ 10월 하순', 120)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('녹두', 6.0, 7.0, '22~30°C', 20.0, '양토,사양토', 2, '5월 중순 ~ 6월 상순', '9월 하순 ~ 10월 중순', 100)
ON CONFLICT (crop_name) DO NOTHING;

-- === 서류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('감자', 5.0, 6.0, '15~20°C', 30.0, '양토,사양토', 2, '3월 하순 ~ 4월 상순', '6월 중순 ~ 7월 상순', 90)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('고구마', 5.5, 6.5, '20~30°C', 25.0, '사양토,양토', 2, '4월 하순 ~ 5월 중순', '9월 하순 ~ 10월 중순', 120)
ON CONFLICT (crop_name) DO NOTHING;

-- === 과채류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('토마토', 6.0, 6.5, '20~28°C', 30.0, '양토,사양토', 3, '2월 ~ 3월 (육묘)', '6월 ~ 10월', 120)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('고추', 6.0, 6.8, '20~28°C', 30.0, '양토,사양토', 3, '2월 (육묘) ~ 5월 (정식)', '7월 ~ 10월', 150)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('오이', 6.0, 7.0, '18~28°C', 25.0, '양토,사양토', 3, '3월 ~ 4월 (육묘)', '5월 ~ 9월', 60)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('호박', 5.5, 6.8, '20~28°C', 25.0, '양토,사양토', 2, '4월 ~ 5월', '7월 ~ 10월', 90)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('수박', 6.0, 7.0, '22~30°C', 25.0, '사양토,양토', 4, '3월 (육묘) ~ 5월 (정식)', '7월 ~ 8월', 90)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('참외', 6.0, 7.0, '22~30°C', 25.0, '사양토,양토', 4, '2월 (육묘) ~ 3월 (정식)', '5월 ~ 8월', 80)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('딸기', 5.5, 6.5, '15~22°C', 30.0, '양토,사양토', 4, '8월 ~ 9월 (정식)', '12월 ~ 5월', 240)
ON CONFLICT (crop_name) DO NOTHING;

-- === 엽채류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('배추', 6.0, 7.0, '15~22°C', 25.0, '양토,식양토', 2, '8월 중순 ~ 9월 상순 (가을)', '10월 하순 ~ 11월 중순', 70)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('양배추', 6.0, 7.0, '15~22°C', 25.0, '양토,사양토', 2, '7월 하순 ~ 8월 상순', '11월 ~ 12월', 90)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('상추', 6.0, 7.0, '15~20°C', 25.0, '양토,사양토', 1, '3월 ~ 10월', '파종 후 30~50일', 40)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('시금치', 6.5, 7.0, '12~18°C', 25.0, '양토,사양토', 1, '3월 ~ 10월', '파종 후 30~45일', 35)
ON CONFLICT (crop_name) DO NOTHING;

-- === 근채류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('무', 5.5, 6.8, '15~22°C', 25.0, '양토,사양토', 2, '8월 중순 ~ 9월 상순 (가을)', '10월 하순 ~ 11월 중순', 60)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('당근', 6.0, 7.0, '15~22°C', 25.0, '사양토,양토', 2, '7월 상순 ~ 7월 하순', '10월 중순 ~ 11월 상순', 100)
ON CONFLICT (crop_name) DO NOTHING;

-- === 양념채소 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('양파', 6.0, 7.0, '15~22°C', 25.0, '양토,식양토', 2, '9월 중순 (파종) ~ 11월 (정식)', '6월 상순 ~ 6월 하순', 240)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('마늘', 6.0, 7.0, '15~22°C', 25.0, '양토,사양토', 2, '9월 하순 ~ 10월 상순', '5월 하순 ~ 6월 중순', 240)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('대파', 6.5, 7.0, '15~22°C', 25.0, '양토,사양토', 2, '3월 ~ 4월 (정식)', '10월 ~ 12월', 120)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('생강', 6.0, 6.5, '20~28°C', 30.0, '양토,사양토', 3, '4월 중순 ~ 5월 상순', '10월 하순 ~ 11월 상순', 180)
ON CONFLICT (crop_name) DO NOTHING;

-- === 특용작물 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('참깨', 6.0, 7.0, '22~28°C', 20.0, '양토,사양토', 2, '5월 하순 ~ 6월 상순', '8월 하순 ~ 9월 상순', 90)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('들깨', 6.0, 7.0, '20~28°C', 20.0, '양토,사양토', 2, '6월 상순 ~ 6월 중순', '9월 하순 ~ 10월 상순', 100)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('땅콩', 6.0, 6.5, '22~28°C', 20.0, '사양토,양토', 2, '4월 하순 ~ 5월 상순', '9월 하순 ~ 10월 상순', 130)
ON CONFLICT (crop_name) DO NOTHING;

-- === 약용작물 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('인삼', 5.5, 6.0, '15~22°C', 30.0, '양토,사양토', 5, '10월 ~ 11월 (이식)', '4년 ~ 6년 후', 1800)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('당귀', 5.5, 6.5, '15~20°C', 25.0, '양토,사양토', 4, '3월 ~ 4월', '10월 ~ 11월', 180)
ON CONFLICT (crop_name) DO NOTHING;

-- === 과수 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('사과', 6.0, 6.5, '18~25°C', 30.0, '양토,사양토', 4, '3월 (묘목 정식)', '9월 ~ 11월', 180)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('배', 5.5, 6.5, '18~25°C', 30.0, '양토,사양토', 4, '3월 (묘목 정식)', '9월 ~ 10월', 180)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('포도', 6.0, 7.0, '20~28°C', 25.0, '양토,사양토', 4, '3월 (묘목 정식)', '8월 ~ 10월', 180)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('복숭아', 6.0, 6.5, '18~28°C', 25.0, '사양토,양토', 4, '3월 (묘목 정식)', '7월 ~ 9월', 150)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('감', 6.0, 6.5, '18~25°C', 25.0, '양토,식양토', 3, '3월 (묘목 정식)', '10월 ~ 11월', 180)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('감귤', 5.5, 6.5, '15~25°C', 25.0, '양토,사양토', 3, '3월 (묘목 정식)', '10월 ~ 12월', 270)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('블루베리', 4.5, 5.5, '18~25°C', 30.0, '사양토,양토', 3, '3월 (묘목 정식)', '6월 ~ 8월', 120)
ON CONFLICT (crop_name) DO NOTHING;

-- === 버섯류 ===
INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('느타리', 6.0, 7.0, '12~18°C', 0.0, '배지재배', 2, '연중 (배지 입상)', '입상 후 15~25일', 25)
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO crop_cultivation_env (crop_name, optimal_ph_min, optimal_ph_max, optimal_temp, organic_matter, soil_types, difficulty, sowing_info, harvest_info, growth_days)
VALUES ('표고버섯', 5.0, 6.0, '15~22°C', 0.0, '원목재배,배지재배', 3, '봄·가을 (접종)', '접종 후 6개월 ~ 1년', 180)
ON CONFLICT (crop_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_crop_cultivation_env_name ON crop_cultivation_env(crop_name);
