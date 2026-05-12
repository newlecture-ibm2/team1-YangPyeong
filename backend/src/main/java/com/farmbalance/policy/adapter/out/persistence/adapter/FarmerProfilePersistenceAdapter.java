package com.farmbalance.policy.adapter.out.persistence.adapter;

import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class FarmerProfilePersistenceAdapter implements LoadFarmerProfilePort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public FarmerProfileData loadFarmerProfile(Long userId) {
        // 1. 유저 정보 조회
        String userSql = """
                SELECT u.name, u.region_code, r.name as region_name
                FROM users u
                LEFT JOIN regions r ON u.region_code = r.code
                WHERE u.id = ? AND u.role = 'FARMER'
                """;
        
        List<Map<String, Object>> users = jdbcTemplate.queryForList(userSql, userId);
        if (users.isEmpty()) {
            return null; // FARMER가 아니거나 유저 없음
        }
        Map<String, Object> userMap = users.get(0);
        String name = (String) userMap.get("name");
        String regionCode = (String) userMap.get("region_code");
        String regionName = (String) userMap.get("region_name");

        // 2. 농장 정보 조회
        String farmSql = """
                SELECT id, area, soil_type, address
                FROM farms
                WHERE user_id = ? AND deleted_at IS NULL AND status = 'OPERATING'
                """;
        List<Map<String, Object>> farmRows = jdbcTemplate.queryForList(farmSql, userId);

        List<FarmerProfileData.FarmData> farms = new ArrayList<>();
        
        for (Map<String, Object> farmRow : farmRows) {
            Long farmId = ((Number) farmRow.get("id")).longValue();
            Double area = farmRow.get("area") != null ? ((Number) farmRow.get("area")).doubleValue() : 0.0;
            String soilType = (String) farmRow.get("soil_type");
            String address = (String) farmRow.get("address");

            // 3. 재배 중인 작물 정보 조회
            String cropSql = """
                    SELECT cr.crop_id, cr.cultivation_area, c.name as crop_name, cc.name as category_name
                    FROM cultivation_registrations cr
                    JOIN crops c ON cr.crop_id = c.id
                    JOIN crop_categories cc ON c.category_id = cc.id
                    WHERE cr.farm_id = ? AND cr.status = 'ACTIVE' AND cr.deleted_at IS NULL
                    """;
            List<Map<String, Object>> cropRows = jdbcTemplate.queryForList(cropSql, farmId);
            
            List<FarmerProfileData.CropData> crops = new ArrayList<>();
            for (Map<String, Object> cropRow : cropRows) {
                crops.add(new FarmerProfileData.CropData(
                        ((Number) cropRow.get("crop_id")).longValue(),
                        (String) cropRow.get("crop_name"),
                        (String) cropRow.get("category_name"),
                        cropRow.get("cultivation_area") != null ? ((Number) cropRow.get("cultivation_area")).doubleValue() : 0.0
                ));
            }
            farms.add(new FarmerProfileData.FarmData(farmId, area, soilType, address, crops));
        }

        return new FarmerProfileData(userId, name, regionCode, regionName, farms);
    }
}
