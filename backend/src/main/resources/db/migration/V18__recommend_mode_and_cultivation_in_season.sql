-- AI 추천 모드(PLAN/MANAGE 등) 및 재배 중 판별용 컬럼

ALTER TABLE cultivation_registrations
    ADD COLUMN IF NOT EXISTS sowing_date DATE,
    ADD COLUMN IF NOT EXISTS in_season BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE recommend_history
    ADD COLUMN IF NOT EXISTS recommend_mode VARCHAR(20);

ALTER TABLE recommend_history_item
    ADD COLUMN IF NOT EXISTS advice_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS mismatch_note VARCHAR(512);

COMMENT ON COLUMN cultivation_registrations.sowing_date IS '파종일 (입력 시 재배 중 판별 보조)';
COMMENT ON COLUMN cultivation_registrations.in_season IS '사용자 확인: 이미 파종·재배 중';
COMMENT ON COLUMN recommend_history.recommend_mode IS 'PLAN | PLANNED | MANAGE | MIXED';
COMMENT ON COLUMN recommend_history_item.advice_type IS 'NEW_RECOMMEND | PLANNED_CROP | IN_SEASON_COACHING | NEXT_SEASON';
