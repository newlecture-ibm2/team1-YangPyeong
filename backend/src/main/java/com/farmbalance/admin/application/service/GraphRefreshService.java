package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.GraphRefreshResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GraphRefreshService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public GraphRefreshResponse refreshGraph() {
        long startTimeMs = System.currentTimeMillis();
        LocalDateTime startedAt = LocalDateTime.now();
        log.info("Graph refresh started");

        Map<String, Integer> entityCounts = new HashMap<>();
        Map<String, Integer> relationCounts = new HashMap<>();

        try {
            // 1. Delete all relations first
            jdbcTemplate.update("DELETE FROM graph.graph_relation");

            // 2. Upsert Entities
            entityCounts.put("REGION", upsertRegions());
            entityCounts.put("CROP", upsertCrops());
            entityCounts.put("FARM", upsertFarms());
            entityCounts.put("FARMER", upsertFarmers());
            entityCounts.put("POLICY", upsertPolicies());
            entityCounts.put("BALANCE_STATUS", upsertBalanceStatus());
            entityCounts.put("CROP_ENV", upsertCropEnv());

            log.info("Entity upsert completed");

            // 3. Rebuild Relations
            relationCounts.put("PARENT_OF", insertParentOf());
            relationCounts.put("OWNS", insertOwns());
            relationCounts.put("LOCATED_IN", insertLocatedIn());
            relationCounts.put("BELONGS_TO", insertBelongsTo());
            relationCounts.put("CULTIVATES", insertCultivates());
            relationCounts.put("SUPPLY_STATUS", insertSupplyStatus());
            relationCounts.put("OBSERVED_IN", insertObservedIn());
            relationCounts.put("REGION_HAS_CROP", insertRegionHasCrop());
            relationCounts.put("SUPPORTS", insertSupports());
            relationCounts.put("TARGETS_CROP", insertTargetsCrop());
            relationCounts.put("SUITED_FOR", insertSuitedFor());
            relationCounts.put("RECOMMENDED_FOR", insertRecommendedFor());

            log.info("Relation rebuild completed");

            long durationMs = System.currentTimeMillis() - startTimeMs;
            LocalDateTime finishedAt = LocalDateTime.now();
            log.info("Graph refresh completed duration={}ms", durationMs);

            return new GraphRefreshResponse(true, startedAt, finishedAt, durationMs, entityCounts, relationCounts, null);
        } catch (Exception e) {
            log.error("Graph refresh failed", e);
            long durationMs = System.currentTimeMillis() - startTimeMs;
            LocalDateTime finishedAt = LocalDateTime.now();
            return new GraphRefreshResponse(false, startedAt, finishedAt, durationMs, entityCounts, relationCounts, e.getMessage());
        }
    }

    // ==========================================
    // Entity Upserts
    // ==========================================

    private int upsertRegions() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'REGION', code, name, jsonb_build_object('type', type, 'parent_id', parent_id), 'regions', id
            FROM regions WHERE type IN ('CITY', 'TOWN') AND is_active = true
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    private int upsertCrops() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'CROP', id::varchar, name, jsonb_build_object('category_id', category_id), 'crops', id
            FROM crops WHERE deleted_at IS NULL
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    private int upsertFarms() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'FARM', id::varchar, name, jsonb_build_object('area', area, 'address', address, 'bjd_code', bjd_code), 'farms', id
            FROM farms WHERE deleted_at IS NULL
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    private int upsertFarmers() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'FARMER', id::varchar, name, jsonb_build_object('email', email, 'region_code', region_code), 'users', id
            FROM users WHERE role = 'FARMER' AND deleted_at IS NULL
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    private int upsertPolicies() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'POLICY', id::varchar, COALESCE(title, '무제 정책 ' || id::varchar), 
                   jsonb_build_object('category', category, 'support_amount', support_amount, 'region_code', region_code, 'target', target), 'policy_data', id
            FROM policy_data WHERE deleted_at IS NULL
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    private int upsertBalanceStatus() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'BALANCE_STATUS', id::varchar, balance_status, 
                   jsonb_build_object('year', year, 'season', season, 'supply_ratio', supply_ratio), 'balance_data', id
            FROM balance_data WHERE deleted_at IS NULL
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    private int upsertCropEnv() {
        String sql = """
            INSERT INTO graph.graph_entity (entity_type, entity_key, name, properties, source_table, source_id)
            SELECT 'CROP_ENV', id::varchar, crop_name, 
                   jsonb_build_object('optimal_temp', optimal_temp, 'optimal_ph_min', optimal_ph_min, 'optimal_ph_max', optimal_ph_max), 'crop_cultivation_env', id
            FROM crop_cultivation_env WHERE deleted_at IS NULL
            ON CONFLICT (entity_type, entity_key) DO UPDATE SET 
                name = EXCLUDED.name, properties = EXCLUDED.properties, source_id = EXCLUDED.source_id, source_table = EXCLUDED.source_table
            """;
        return jdbcTemplate.update(sql);
    }

    // ==========================================
    // Relation Inserts
    // ==========================================

    private int insertParentOf() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'PARENT_OF', g_parent.id, g_child.id, '{}'::jsonb, 'regions'
            FROM regions r
            JOIN graph.graph_entity g_parent ON g_parent.entity_type = 'REGION' AND g_parent.source_id = r.parent_id
            JOIN graph.graph_entity g_child ON g_child.entity_type = 'REGION' AND g_child.source_id = r.id
            WHERE r.parent_id IS NOT NULL AND r.type IN ('CITY', 'TOWN') AND r.is_active = true
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertOwns() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'OWNS', g_user.id, g_farm.id, '{}'::jsonb, 'farms'
            FROM farms f
            JOIN graph.graph_entity g_user ON g_user.entity_type = 'FARMER' AND g_user.source_id = f.user_id
            JOIN graph.graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = f.id
            WHERE f.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertLocatedIn() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'LOCATED_IN', g_farm.id, g_region.id, jsonb_build_object('match_method', 'ADDRESS_LIKE'), 'farms'
            FROM farms f
            JOIN graph.graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = f.id
            JOIN graph.graph_entity g_region ON g_region.entity_type = 'REGION' AND (f.bjd_code = g_region.entity_key OR f.address LIKE '%' || g_region.name || '%')
            WHERE f.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertBelongsTo() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'BELONGS_TO', g_user.id, g_region.id, '{}'::jsonb, 'users'
            FROM users u
            JOIN graph.graph_entity g_user ON g_user.entity_type = 'FARMER' AND g_user.source_id = u.id
            JOIN graph.graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = u.region_code
            WHERE u.role = 'FARMER' AND u.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertCultivates() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'CULTIVATES', g_farm.id, g_crop.id, 
                   jsonb_build_object('area', cr.cultivation_area, 'estimated_yield', cr.farmer_estimated_yield, 'yield_unit', cr.yield_unit, 'status', cr.status), 'cultivation_registrations'
            FROM cultivation_registrations cr
            JOIN graph.graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = cr.farm_id
            JOIN graph.graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = cr.crop_id
            WHERE cr.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertSupplyStatus() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'SUPPLY_STATUS', g_crop.id, g_balance.id, '{}'::jsonb, 'balance_data'
            FROM balance_data b
            JOIN graph.graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = b.crop_id
            JOIN graph.graph_entity g_balance ON g_balance.entity_type = 'BALANCE_STATUS' AND g_balance.source_id = b.id
            WHERE b.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertObservedIn() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'OBSERVED_IN', g_balance.id, g_region.id, '{}'::jsonb, 'balance_data'
            FROM balance_data b
            JOIN graph.graph_entity g_balance ON g_balance.entity_type = 'BALANCE_STATUS' AND g_balance.source_id = b.id
            JOIN graph.graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = b.region_code
            WHERE b.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertRegionHasCrop() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'REGION_HAS_CROP', g_region.id, g_crop.id, 
                   jsonb_build_object('year', b.year, 'season', b.season, 'balance_status', b.balance_status, 'supply_ratio', b.supply_ratio), 'balance_data'
            FROM balance_data b
            JOIN graph.graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = b.region_code
            JOIN graph.graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = b.crop_id
            WHERE b.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertSupports() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'SUPPORTS', g_policy.id, g_region.id, '{}'::jsonb, 'policy_data'
            FROM policy_data p
            JOIN graph.graph_entity g_policy ON g_policy.entity_type = 'POLICY' AND g_policy.source_id = p.id
            JOIN graph.graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = p.region_code
            WHERE p.deleted_at IS NULL AND p.region_code IS NOT NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertTargetsCrop() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'TARGETS_CROP', g_policy.id, g_crop.id, jsonb_build_object('match_method', 'KEYWORD', 'confidence', 'LOW'), 'policy_data'
            FROM policy_data p
            JOIN crops c ON p.title LIKE '%' || c.name || '%' OR p.target LIKE '%' || c.name || '%' OR p.category LIKE '%' || c.name || '%'
            JOIN graph.graph_entity g_policy ON g_policy.entity_type = 'POLICY' AND g_policy.source_id = p.id
            JOIN graph.graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = c.id
            WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertSuitedFor() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'SUITED_FOR', g_env.id, g_crop.id, '{}'::jsonb, 'crop_cultivation_env'
            FROM crop_cultivation_env env
            JOIN crops c ON env.crop_name = c.name
            JOIN graph.graph_entity g_env ON g_env.entity_type = 'CROP_ENV' AND g_env.source_id = env.id
            JOIN graph.graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = c.id
            WHERE env.deleted_at IS NULL AND c.deleted_at IS NULL
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }

    private int insertRecommendedFor() {
        String sql = """
            INSERT INTO graph.graph_relation (relation_type, from_entity_id, to_entity_id, properties, source_table)
            SELECT 'RECOMMENDED_FOR', g_crop.id, g_farm.id, 
                   jsonb_build_object('rank', rhi.rank, 'score', rhi.score, 'soil_fitness', rhi.soil_fitness, 'ai_reason', rhi.ai_reason), 'recommend_history_item'
            FROM recommend_history_item rhi
            JOIN recommend_history rh ON rh.id = rhi.history_id
            JOIN graph.graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = rhi.crop_id
            JOIN graph.graph_entity g_farm ON g_farm.entity_type = 'FARM' AND g_farm.source_id = rh.farm_id
            ON CONFLICT (relation_type, from_entity_id, to_entity_id) DO NOTHING
            """;
        return jdbcTemplate.update(sql);
    }
}
