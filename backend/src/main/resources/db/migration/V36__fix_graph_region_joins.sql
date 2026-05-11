-- OBSERVED_IN (BALANCE_STATUS -> REGION) 관계 복구
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'OBSERVED_IN', 
    g_balance.id, 
    g_region.id, 
    '{}'::jsonb, 
    'balance_data'
FROM balance_data b
JOIN graph_entity g_balance ON g_balance.entity_type = 'BALANCE_STATUS' AND g_balance.source_id = b.id
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND RPAD(g_region.entity_key, 10, '0') = b.region_code
WHERE b.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- REGION_HAS_CROP (REGION -> CROP) 관계 복구
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'REGION_HAS_CROP', 
    g_region.id, 
    g_crop.id, 
    jsonb_build_object('year', b.year, 'season', b.season, 'balance_status', b.balance_status, 'supply_ratio', b.supply_ratio), 
    'balance_data'
FROM balance_data b
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND RPAD(g_region.entity_key, 10, '0') = b.region_code
JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = b.crop_id
WHERE b.deleted_at IS NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;

-- SUPPORTS (POLICY -> REGION) 관계 복구
INSERT INTO graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
SELECT 
    'SUPPORTS', 
    g_policy.id, 
    g_region.id, 
    '{}'::jsonb, 
    'policy_data'
FROM policy_data p
JOIN graph_entity g_policy ON g_policy.entity_type = 'POLICY' AND g_policy.source_id = p.id
JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND RPAD(g_region.entity_key, 10, '0') = p.region_code
WHERE p.deleted_at IS NULL AND p.region_code IS NOT NULL
ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING;
