-- 이슈 6: pests(병해충) 컬럼 추가 (쉼표 구분 문자열)
ALTER TABLE recommend_history_item ADD COLUMN pests TEXT;

-- 이슈 9: 이력 조회 성능 최적화 인덱스
CREATE INDEX idx_recommend_history_farm_generated
    ON recommend_history(farm_id, generated_at DESC);
