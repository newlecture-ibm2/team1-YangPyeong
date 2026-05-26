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

    private static final List<String> EXCLUDED_CATEGORIES = List.of(
            "화훼", "사료작물", "foreign workers", "축산"
    );

    @Transactional
    public void syncCrops(String syncMode) {
        log.info("Starting Nongsaro farmWorkingPlan synchronization with mode: {}", syncMode);
        boolean isForce = "FORCE".equalsIgnoreCase(syncMode);

        List<AdminNongsaroCropGroupDto> groupList = nongsaroApiPort.getWorkScheduleGroupList();

        for (AdminNongsaroCropGroupDto group : groupList) {
            String categoryName = cleanName(group.getCategoryName());
            String groupExternalId = group.getExternalId();
            if (categoryName == null || categoryName.isEmpty() || groupExternalId == null) continue;

            boolean isExcluded = EXCLUDED_CATEGORIES.stream()
                    .anyMatch(excluded -> excluded.equalsIgnoreCase(categoryName));
            if (isExcluded) {
                log.info("Skipping excluded category: {}", categoryName);
                continue;
            }

            Long categoryId = resolveCategoryId(group, categoryName, groupExternalId, isForce);
            if (categoryId == null) {
                continue;
            }

            List<AdminNongsaroCropDto> cropList = nongsaroApiPort.getWorkScheduleList(groupExternalId);
            for (AdminNongsaroCropDto cropDto : cropList) {
                String cropName = cleanName(cropDto.getCropName());
                String cropExternalId = cropDto.getExternalId();
                if (cropName == null || cropName.isEmpty() || cropExternalId == null) {
                    continue;
                }
                upsertCrop(cropName, cropExternalId, categoryId, isForce);
            }
        }
        log.info("Nongsaro farmWorkingPlan synchronization completed successfully.");
    }

    private Long resolveCategoryId(AdminNongsaroCropGroupDto group, String categoryName,
                                   String groupExternalId, boolean isForce) {
        Optional<AdminCropCategory> existingCatOpt = adminCropCategoryPort.findByExternalId(groupExternalId);

        if (existingCatOpt.isPresent()) {
            AdminCropCategory existingCat = existingCatOpt.get();
            if (!isForce && isProtectedFromMerge(existingCat, categoryName)) {
                log.debug("MERGE: skip protected category externalId={}", groupExternalId);
                return existingCat.getId();
            }
            if (isManualDataSource(existingCat.getDataSource())) {
                if (!isForce) {
                    return existingCat.getId();
                }
                existingCat.setName(categoryName);
                existingCat.setDescription("농사로 농작업일정에서 동기화된 카테고리");
                existingCat.setDataSource("NONGSARO");
                adminCropCategoryPort.update(existingCat);
                return existingCat.getId();
            }
            if (isForce) {
                existingCat.setName(categoryName);
                adminCropCategoryPort.update(existingCat);
            }
            return existingCat.getId();
        }

        Optional<AdminCropCategory> existingByName = adminCropCategoryPort.findByName(categoryName);
        if (existingByName.isPresent()) {
            AdminCropCategory existingCat = existingByName.get();
            if (!isForce && isProtectedFromMerge(existingCat, categoryName)) {
                log.debug("MERGE: skip protected category by name={}", categoryName);
                return existingCat.getId();
            }
            if (isManualDataSource(existingCat.getDataSource())) {
                if (!isForce) {
                    return existingCat.getId();
                }
                existingCat.setExternalId(groupExternalId);
                existingCat.setDescription("농사로 농작업일정에서 동기화된 카테고리");
                existingCat.setName(categoryName);
                existingCat.setDataSource("NONGSARO");
                adminCropCategoryPort.update(existingCat);
                return existingCat.getId();
            }
            existingCat.setExternalId(groupExternalId);
            if (isForce) {
                existingCat.setDescription("농사로 농작업일정에서 동기화된 카테고리");
            }
            adminCropCategoryPort.update(existingCat);
            return existingCat.getId();
        }

        AdminCropCategory newCategory = AdminCropCategory.builder()
                .name(categoryName)
                .description("농사로 농작업일정에서 동기화된 카테고리")
                .displayOrder(group.getSortOrder() != null ? group.getSortOrder() : 999)
                .isActive(true)
                .externalId(groupExternalId)
                .dataSource("NONGSARO")
                .build();
        return adminCropCategoryPort.save(newCategory);
    }

    private void upsertCrop(String cropName, String cropExternalId, Long categoryId, boolean isForce) {
        Optional<AdminCrop> existingCropOpt = adminCropPort.findByExternalId(cropExternalId);

        if (existingCropOpt.isPresent()) {
            AdminCrop existingCrop = existingCropOpt.get();
            if (!isForce && isProtectedFromMerge(existingCrop, cropName)) {
                log.debug("MERGE: skip protected crop externalId={}", cropExternalId);
                return;
            }
            if (isManualDataSource(existingCrop.getDataSource())) {
                if (!isForce) {
                    return;
                }
                applyNongsaroCrop(existingCrop, cropName, categoryId);
                adminCropPort.update(existingCrop);
                return;
            }
            if (isForce) {
                applyNongsaroCrop(existingCrop, cropName, categoryId);
                adminCropPort.update(existingCrop);
            }
            return;
        }

        Optional<AdminCrop> existingByName = adminCropPort.findByName(cropName);
        if (existingByName.isPresent()) {
            AdminCrop existingCrop = existingByName.get();
            if (isManualDataSource(existingCrop.getDataSource())) {
                if (!isForce) {
                    log.debug("MERGE: skip manually edited crop by name={}", cropName);
                    return;
                }
                existingCrop.setExternalId(cropExternalId);
                applyNongsaroCrop(existingCrop, cropName, categoryId);
                adminCropPort.update(existingCrop);
                return;
            }
            existingCrop.setExternalId(cropExternalId);
            if (isForce) {
                applyNongsaroCrop(existingCrop, cropName, categoryId);
            }
            adminCropPort.update(existingCrop);
            return;
        }

        AdminCrop newCrop = AdminCrop.builder()
                .categoryId(categoryId)
                .name(cropName)
                .externalId(cropExternalId)
                .dataSource("NONGSARO")
                .build();
        adminCropPort.save(newCrop);
    }

    private static void applyNongsaroCrop(AdminCrop crop, String cropName, Long categoryId) {
        crop.setName(cropName);
        crop.setCategoryId(categoryId);
        crop.setDataSource("NONGSARO");
    }

    private static boolean isManualDataSource(String dataSource) {
        return "MANUAL".equalsIgnoreCase(dataSource);
    }

    private static boolean isProtectedFromMerge(AdminCrop crop, String apiName) {
        if (isManualDataSource(crop.getDataSource())) {
            return true;
        }
        return crop.getName() != null && apiName != null && !crop.getName().equals(apiName);
    }

    private static boolean isProtectedFromMerge(AdminCropCategory category, String apiName) {
        if (isManualDataSource(category.getDataSource())) {
            return true;
        }
        return category.getName() != null && apiName != null && !category.getName().equals(apiName);
    }

    private String cleanName(String original) {
        if (original == null) {
            return null;
        }
        return original.replaceAll("\\(.*?\\)", "").trim();
    }

    public void healthCheck() {
        log.info("Starting Nongsaro health check...");
        List<AdminNongsaroCropGroupDto> groupList = nongsaroApiPort.getWorkScheduleGroupList();
        if (groupList == null || groupList.isEmpty()) {
            throw new RuntimeException("Nongsaro API returned empty list.");
        }
        log.info("Nongsaro health check passed. Fetched {} groups.", groupList.size());
    }
}
