package com.farmbalance.policy.application.port.out;

import java.util.List;

public interface LoadFarmerProfilePort {

    FarmerProfileData loadFarmerProfile(Long userId);

    record FarmerProfileData(
            Long userId,
            String name,
            String regionCode,
            String regionName,
            List<FarmData> farms
    ) {
        public record FarmData(
                Long farmId,
                Double area,
                String soilType,
                String address,
                List<CropData> crops
        ) {}

        public record CropData(
                Long cropId,
                String cropName,
                String cropCategory,
                Double cultivationArea
        ) {}
    }
}
