package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminProductCategory;

import java.util.List;

/**
 * ADM-009 상품 카테고리 관리용 Output Port
 */
public interface AdminProductCategoryPort {

    List<AdminProductCategory> findAll();
}
