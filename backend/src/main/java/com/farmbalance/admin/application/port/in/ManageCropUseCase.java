package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.AdminCrop;
import com.farmbalance.admin.domain.AdminCropCategory;

import java.util.List;

/**
 * ADM-003 작물 마스터 관리 Input Port
 * 카테고리 CRUD + 작물 CRUD (등록/수정/비활성화)
 */
public interface ManageCropUseCase {

    // ── 카테고리 ──

    /** 전체 카테고리 목록 조회 */
    List<AdminCropCategory> getAllCategories();

    /** 카테고리 등록 */
    Long createCategory(AdminCropCategory category);

    /** 카테고리 수정 */
    void updateCategory(Long id, AdminCropCategory category);

    /** 카테고리 삭제 (soft delete) */
    void deleteCategory(Long id);

    // ── 작물 ──

    /** 작물 목록 조회 (카테고리, 키워드, 활성 여부 필터) */
    List<AdminCrop> getCrops(Long categoryId, String keyword, Boolean isActive);

    /** 작물 단건 조회 */
    AdminCrop getCropById(Long id);

    /** 작물 등록 (코드 자동 생성, 이름 중복 검사) */
    Long createCrop(AdminCrop crop);

    /** 작물 수정 */
    void updateCrop(Long id, AdminCrop crop);

    /** 작물 비활성화 */
    void deactivateCrop(Long id);
}

