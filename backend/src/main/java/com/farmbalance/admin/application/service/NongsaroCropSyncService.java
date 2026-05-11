package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.out.dto.AdminNongsaroCropGroupDto;
import com.farmbalance.admin.application.port.out.dto.AdminNongsaroCropDto;
import com.farmbalance.admin.application.port.out.AdminCropCategoryPort;
import com.farmbalance.admin.application.port.out.AdminCropPort;
import com.farmbalance.admin.application.port.out.AdminNongsaroApiPort;
import com.farmbalance.admin.domain.AdminCrop;
import com.farmbalance.admin.domain.AdminCropCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NongsaroCropSyncService {

    private final AdminNongsaroApiPort nongsaroApiPort;
    private final AdminCropCategoryPort adminCropCategoryPort;
    private final AdminCropPort adminCropPort;

    @Transactional
    public void syncCrops(String syncMode) {
        log.info("Starting Nongsaro farmWorkingPlan synchronization with mode: {}", syncMode);
        boolean isForce = "FORCE".equalsIgnoreCase(syncMode);
        
        List<AdminNongsaroCropGroupDto> groupList = nongsaroApiPort.getWorkScheduleGroupList();
        
        for (AdminNongsaroCropGroupDto group : groupList) {
            String categoryName = cleanName(group.getCategoryName());
            String groupExternalId = group.getExternalId();
            if (categoryName == null || categoryName.isEmpty() || groupExternalId == null) continue;
            
            // 1. 카테고리 저장/업데이트
            Long categoryId;
            Optional<AdminCropCategory> existingCatOpt = adminCropCategoryPort.findByExternalId(groupExternalId);
            
            if (existingCatOpt.isEmpty()) {
                AdminCropCategory newCategory = AdminCropCategory.builder()
                        .name(categoryName)
                        .description("농사로 농작업일정에서 동기화된 카테고리")
                        .displayOrder(group.getSortOrder() != null ? group.getSortOrder() : 999)
                        .isActive(true)
                        .externalId(groupExternalId)
                        .dataSource("NONGSARO")
                        .build();
                categoryId = adminCropCategoryPort.save(newCategory);
            } else {
                AdminCropCategory existingCat = existingCatOpt.get();
                categoryId = existingCat.getId();
                if (isForce && "NONGSARO".equals(existingCat.getDataSource())) {
                    existingCat.setName(categoryName);
                    adminCropCategoryPort.update(existingCat);
                }
            }

            // 2. 해당 그룹의 작물 리스트 조회
            List<AdminNongsaroCropDto> cropList = nongsaroApiPort.getWorkScheduleList(groupExternalId);
            for (AdminNongsaroCropDto cropDto : cropList) {
                // 괄호 내용 등 부가 정보를 제거하여 깔끔한 작물명 유지
                String cropName = cleanName(cropDto.getCropName());
                String cropExternalId = cropDto.getExternalId();
                if (cropName == null || cropName.isEmpty() || cropExternalId == null) {
                    continue;
                }
                
                // 3. 작물 저장/업데이트
                Optional<AdminCrop> existingCropOpt = adminCropPort.findByExternalId(cropExternalId);
                
                if (existingCropOpt.isEmpty()) {
                    AdminCrop newCrop = AdminCrop.builder()
                            .categoryId(categoryId)
                            .name(cropName)
                            .externalId(cropExternalId)
                            .dataSource("NONGSARO")
                            .build();
                    adminCropPort.save(newCrop);
                } else {
                    AdminCrop existingCrop = existingCropOpt.get();
                    if (isForce && "NONGSARO".equals(existingCrop.getDataSource())) {
                        existingCrop.setName(cropName);
                        existingCrop.setCategoryId(categoryId);
                        adminCropPort.update(existingCrop);
                    }
                }
            }
        }
        log.info("Nongsaro farmWorkingPlan synchronization completed successfully.");
    }

    private String cleanName(String original) {
        if (original == null) {
            return null;
        }
        // 정규식을 사용하여 괄호()와 그 안의 내용 제거 후 앞뒤 공백 제거
        return original.replaceAll("\\(.*?\\)", "").trim();
    }
}
