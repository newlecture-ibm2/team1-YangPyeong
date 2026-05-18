-- 농장 대시보드·AI 추천 이력 조회 경로용 인덱스 (읽기 성능, 결과 집합 불변)

-- RecommendHistoryRepository: findFirstByFarmIdOrderByGeneratedAtDesc, findTop20ByFarmIdOrderByGeneratedAtDesc
CREATE INDEX IF NOT EXISTS idx_recommend_history_farm_generated
    ON recommend_history (farm_id, generated_at DESC);

-- 재배 이력: farm_id 기준 목록
CREATE INDEX IF NOT EXISTS idx_cultivation_history_farm_created
    ON cultivation_history (farm_id, created_at DESC);

-- 재배 등록: 활성 행만 농장별 조회 (deleted_at IS NULL 필터와 정합)
CREATE INDEX IF NOT EXISTS idx_cultivation_registrations_farm_active
    ON cultivation_registrations (farm_id)
    WHERE deleted_at IS NULL;
