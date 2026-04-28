package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminCropCategory;

import java.util.List;

/**
 * ADM-003 작물 카테고리 관리용 Output Port
 */
public interface AdminCropCategoryPort {

    List<AdminCropCategory> findAll();
}
