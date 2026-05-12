package com.farmbalance.policy.adapter.out.persistence.adapter;

import com.farmbalance.policy.application.port.out.PolicyGraphQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PolicyGraphPersistenceAdapter implements PolicyGraphQueryPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<Map<String, Object>> findRelationsForFarmerAndPolicies(Long farmerId, List<Long> policyIds) {
        if (policyIds == null || policyIds.isEmpty()) {
            return List.of();
        }

        String policyIdsStr = policyIds.stream().map(String::valueOf).collect(Collectors.joining(","));

        // 농업인과 직접/간접 연결된 엔티티(FARM, CROP, REGION) 및 주어진 정책(POLICY)과 연관된 릴레이션 조회
        String sql = """
            WITH RECURSIVE farmer_graph AS (
                -- 1. FARMER 출발
                SELECT ge.id AS entity_id
                FROM graph.graph_entity ge
                WHERE ge.entity_type = 'FARMER' AND ge.source_id = ?
                
                UNION
                
                -- 2. FARMER와 연결된 FARM, REGION 등
                SELECT gr.to_entity_id
                FROM graph.graph_relation gr
                JOIN farmer_graph fg ON fg.entity_id = gr.from_entity_id
            ),
            target_policies AS (
                SELECT ge.id AS entity_id
                FROM graph.graph_entity ge
                WHERE ge.entity_type = 'POLICY' AND ge.source_id IN (%s)
            ),
            relevant_entities AS (
                SELECT entity_id FROM farmer_graph
                UNION
                SELECT entity_id FROM target_policies
                UNION
                -- 정책이 가리키는 CROP, REGION 포함
                SELECT gr.to_entity_id 
                FROM graph.graph_relation gr
                JOIN target_policies tp ON tp.entity_id = gr.from_entity_id
            )
            SELECT 
                gr.relation_type,
                e_from.entity_type AS from_type,
                e_from.name AS from_name,
                e_to.entity_type AS to_type,
                e_to.name AS to_name,
                gr.properties AS relation_properties
            FROM graph.graph_relation gr
            JOIN graph.graph_entity e_from ON e_from.id = gr.from_entity_id
            JOIN graph.graph_entity e_to ON e_to.id = gr.to_entity_id
            WHERE gr.from_entity_id IN (SELECT entity_id FROM relevant_entities)
              AND gr.to_entity_id IN (SELECT entity_id FROM relevant_entities)
        """.formatted(policyIdsStr);

        return jdbcTemplate.queryForList(sql, farmerId);
    }
}
