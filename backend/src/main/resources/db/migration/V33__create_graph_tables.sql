-- 1. graph_entity 테이블 생성
CREATE TABLE IF NOT EXISTS graph_entity (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_key VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    source_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_entity UNIQUE (entity_type, entity_key)
);

CREATE INDEX IF NOT EXISTS idx_graph_entity_type ON graph_entity(entity_type);
CREATE INDEX IF NOT EXISTS idx_graph_entity_type_key ON graph_entity(entity_type, entity_key);

-- 2. graph_relation 테이블 생성
CREATE TABLE IF NOT EXISTS graph_relation (
    id BIGSERIAL PRIMARY KEY,
    relation_type VARCHAR(50) NOT NULL,
    from_entity_id BIGINT NOT NULL,
    to_entity_id BIGINT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_relation UNIQUE (relation_type, from_entity_id, to_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_graph_relation_type ON graph_relation(relation_type);
CREATE INDEX IF NOT EXISTS idx_graph_relation_from ON graph_relation(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_relation_to ON graph_relation(to_entity_id);

-- ==========================================
-- 3. Entity INSERT
-- ==========================================

-- REGION
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'REGION', 
    code, 
    name, 
    jsonb_build_object('type', type, 'parent_id', parent_id), 
    'regions', 
    id
FROM regions
WHERE type IN ('CITY', 'TOWN') AND is_active = true
ON CONFLICT (entity_type, entity_key) DO NOTHING;

-- CROP
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'CROP', 
    id::varchar, 
    name, 
    jsonb_build_object('category_id', category_id), 
    'crops', 
    id
FROM crops
WHERE deleted_at IS NULL
ON CONFLICT (entity_type, entity_key) DO NOTHING;

-- FARM
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'FARM', 
    id::varchar, 
    name, 
    jsonb_build_object('area', area, 'address', address, 'bjd_code', bjd_code), 
    'farms', 
    id
FROM farms
WHERE deleted_at IS NULL
ON CONFLICT (entity_type, entity_key) DO NOTHING;

-- FARMER
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'FARMER', 
    id::varchar, 
    name, 
    jsonb_build_object('email', email, 'region_code', region_code), 
    'users', 
    id
FROM users
WHERE role = 'FARMER' AND deleted_at IS NULL
ON CONFLICT (entity_type, entity_key) DO NOTHING;

-- POLICY
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'POLICY', 
    id::varchar, 
    COALESCE(title, '무제 정책 ' || id::varchar), 
    jsonb_build_object('category', category, 'support_amount', support_amount, 'region_code', region_code, 'target', target), 
    'policy_data', 
    id
FROM policy_data
WHERE deleted_at IS NULL
ON CONFLICT (entity_type, entity_key) DO NOTHING;

-- BALANCE_STATUS
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'BALANCE_STATUS', 
    id::varchar, 
    balance_status, 
    jsonb_build_object('year', year, 'season', season, 'supply_ratio', supply_ratio), 
    'balance_data', 
    id
FROM balance_data
WHERE deleted_at IS NULL
ON CONFLICT (entity_type, entity_key) DO NOTHING;

-- CROP_ENV
INSERT INTO graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
SELECT 
    'CROP_ENV', 
    id::varchar, 
    crop_name, 
    jsonb_build_object('optimal_temp', optimal_temp, 'optimal_ph_min', optimal_ph_min, 'optimal_ph_max', optimal_ph_max), 
    'crop_cultivation_env', 
    id
FROM crop_cultivation_env
WHERE deleted_at IS NULL
ON CONFLICT (entity_type, entity_key) DO NOTHING;


-- ==========================================
-- 4. Relation INSERT
-- ==========================================

-- 1. PARENT_OF (REGION -> REGION)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'PARENT_OF', 
    g_parent.id, 
    g_child.id, 
    '{}'::jsonb, 
    'regions'
FROM regions r
JOIN graph_entity g_parent ON g_parent.entity_type = 'REGION' AND g_parent.source_id = r.parent_id
JOIN graph_entity g_child ON g_child.entity_type = 'REGION' AND g_child.source_id = r.id
WHERE r.parent_id IS NOT NULL AND r.type IN ('CITY', 'TOWN') AND r.is_active = true
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 2. OWNS (FARMER -> FARM)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'OWNS', 
    g_user.id, 
    g_farm.id, 
    '{}'::jsonb, 
    'farms'
FROM farms f
JOIN graph_entity g_user ON g_user.entity_type = 'FARMER' AND g_user.source_id = f.user_id
JOIN graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = f.id
WHERE f.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 3. LOCATED_IN (FARM -> REGION)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'LOCATED_IN', 
    g_farm.id, 
    g_region.id, 
    jsonb_build_object('match_method', 'ADDRESS_LIKE'), 
    'farms'
FROM farms f
JOIN graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = f.id
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND (f.bjd_code = g_region.entity_key OR f.address LIKE '%' || g_region.name || '%')
WHERE f.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 4. BELONGS_TO (FARMER -> REGION)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'BELONGS_TO', 
    g_user.id, 
    g_region.id, 
    '{}'::jsonb, 
    'users'
FROM users u
JOIN graph_entity g_user ON g_user.entity_type = 'FARMER' AND g_user.source_id = u.id
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = u.region_code
WHERE u.role = 'FARMER' AND u.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 5. CULTIVATES (FARM -> CROP)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'CULTIVATES', 
    g_farm.id, 
    g_crop.id, 
    jsonb_build_object('area', cr.cultivation_area, 'estimated_yield', cr.farmer_estimated_yield, 'yield_unit', cr.yield_unit, 'status', cr.status), 
    'cultivation_registrations'
FROM cultivation_registrations cr
JOIN graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = cr.farm_id
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = cr.crop_id
WHERE cr.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 6. SUPPLY_STATUS (CROP -> BALANCE_STATUS)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'SUPPLY_STATUS', 
    g_crop.id, 
    g_balance.id, 
    '{}'::jsonb, 
    'balance_data'
FROM balance_data b
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = b.crop_id
JOIN graph_entity g_balance ON g_balance.entity_type = 'BALANCE_STATUS' AND g_balance.source_id = b.id
WHERE b.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 7. OBSERVED_IN (BALANCE_STATUS -> REGION)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'OBSERVED_IN', 
    g_balance.id, 
    g_region.id, 
    '{}'::jsonb, 
    'balance_data'
FROM balance_data b
JOIN graph_entity g_balance ON g_balance.entity_type = 'BALANCE_STATUS' AND g_balance.source_id = b.id
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = b.region_code
WHERE b.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 8. REGION_HAS_CROP (REGION -> CROP)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'REGION_HAS_CROP', 
    g_region.id, 
    g_crop.id, 
    jsonb_build_object('year', b.year, 'season', b.season, 'balance_status', b.balance_status, 'supply_ratio', b.supply_ratio), 
    'balance_data'
FROM balance_data b
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = b.region_code
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = b.crop_id
WHERE b.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 9. SUPPORTS (POLICY -> REGION)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'SUPPORTS', 
    g_policy.id, 
    g_region.id, 
    '{}'::jsonb, 
    'policy_data'
FROM policy_data p
JOIN graph_entity g_policy ON g_policy.entity_type = 'POLICY' AND g_policy.source_id = p.id
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = p.region_code
WHERE p.deleted_at IS NULL AND p.region_code IS NOT NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 10. TARGETS_CROP (POLICY -> CROP)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'TARGETS_CROP', 
    g_policy.id, 
    g_crop.id, 
    jsonb_build_object('match_method', 'KEYWORD', 'confidence', 'LOW'), 
    'policy_data'
FROM policy_data p
JOIN crops c ON p.title LIKE '%' || c.name || '%' OR p.target LIKE '%' || c.name || '%' OR p.category LIKE '%' || c.name || '%'
JOIN graph_entity g_policy ON g_policy.entity_type = 'POLICY' AND g_policy.source_id = p.id
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = c.id
WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 11. SUITED_FOR (CROP_ENV -> CROP)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'SUITED_FOR', 
    g_env.id, 
    g_crop.id, 
    '{}'::jsonb, 
    'crop_cultivation_env'
FROM crop_cultivation_env env
JOIN crops c ON env.crop_name = c.name
JOIN graph_entity g_env ON g_env.entity_type = 'CROP_ENV' AND g_env.source_id = env.id
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = c.id
WHERE env.deleted_at IS NULL AND c.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- 12. RECOMMENDED_FOR (CROP -> FARM)
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'RECOMMENDED_FOR', 
    g_crop.id, 
    g_farm.id, 
    jsonb_build_object('rank', rhi.rank, 'score', rhi.score, 'soil_fitness', rhi.soil_fitness, 'ai_reason', rhi.ai_reason), 
    'recommend_history_item'
FROM recommend_history_item rhi
JOIN recommend_history rh ON rh.id = rhi.history_id
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = rhi.crop_id
JOIN graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = rh.farm_id
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;
