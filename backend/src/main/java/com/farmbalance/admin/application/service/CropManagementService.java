package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageCropUseCase;
import com.farmbalance.admin.application.port.out.AdminCropCategoryPort;
import com.farmbalance.admin.application.port.out.AdminCropPort;
import com.farmbalance.admin.domain.AdminCrop;
import com.farmbalance.admin.domain.AdminCropCategory;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ADM-003 작물 마스터 관리 Service
 * 카테고리 조회, 작물 등록/수정/비활성화
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CropManagementService implements ManageCropUseCase {

    private final AdminCropPort adminCropPort;
    private final AdminCropCategoryPort adminCropCategoryPort;

    @Override
    public List<AdminCropCategory> getAllCategories() {
        return adminCropCategoryPort.findAll();
    }

    @Override
    @Transactional
    public Long createCategory(AdminCropCategory category) {
        if (adminCropCategoryPort.existsByName(category.getName())) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 등록된 카테고리명입니다: " + category.getName());
        }
        return adminCropCategoryPort.save(category);
    }

    @Override
    @Transactional
    public void updateCategory(Long id, AdminCropCategory category) {
        adminCropCategoryPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_ACTION_FAILED, "카테고리를 찾을 수 없습니다."));

        if (category.getName() != null && adminCropCategoryPort.existsByNameExcludeId(category.getName(), id)) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 등록된 카테고리명입니다: " + category.getName());
        }

        adminCropCategoryPort.update(AdminCropCategory.builder()
                .id(id)
                .name(category.getName())
                .description(category.getDescription())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .build());
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        adminCropCategoryPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_ACTION_FAILED, "카테고리를 찾을 수 없습니다."));
        adminCropCategoryPort.delete(id);
    }

    @Override
    public List<AdminCrop> getCrops(Long categoryId, String keyword, Boolean isActive) {
        return adminCropPort.findByFilter(categoryId, keyword, isActive);
    }

    @Override
    public AdminCrop getCropById(Long id) {
        return adminCropPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CROP_NOT_FOUND));
    }

    @Override
    @Transactional
    public Long createCrop(AdminCrop crop) {
        // 작물명 중복 검사
        if (adminCropPort.existsByName(crop.getName())) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 등록된 작물명입니다: " + crop.getName());
        }
        return adminCropPort.save(crop);
    }

    @Override
    @Transactional
    public void updateCrop(Long id, AdminCrop crop) {
        // 대상 존재 확인
        adminCropPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CROP_NOT_FOUND));

        // 이름 변경 시 중복 검사 (자기 자신 제외)
        if (crop.getName() != null && adminCropPort.existsByNameExcludeId(crop.getName(), id)) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 등록된 작물명입니다: " + crop.getName());
        }

        adminCropPort.update(AdminCrop.builder()
                .id(id)
                .categoryId(crop.getCategoryId())
                .name(crop.getName())
                .growthDays(crop.getGrowthDays())
                .yieldPerSqm(crop.getYieldPerSqm())
                .avgCostPerSqm(crop.getAvgCostPerSqm())
                .climateConditions(crop.getClimateConditions())
                .isActive(crop.getIsActive())
                .build());
    }

    @Override
    @Transactional
    public void deactivateCrop(Long id) {
        adminCropPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CROP_NOT_FOUND));
        adminCropPort.deactivate(id);
    }
}
