package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminProduct;

import java.util.List;
import java.util.Optional;

/**
 * ADM-009 상점 상품 관리용 Output Port
 */
public interface AdminProductPort {

    List<AdminProduct> findAll();

    Optional<AdminProduct> findById(Long id);

    void updateStatus(Long id, String status);
}
