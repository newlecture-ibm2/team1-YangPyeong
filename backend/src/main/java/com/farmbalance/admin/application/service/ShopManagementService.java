package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.admin.application.port.out.AdminProductPort;
import com.farmbalance.admin.domain.AdminProduct;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ADM-009 상점 관리 UseCase 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopManagementService implements ManageShopUseCase {

    private final AdminProductPort adminProductPort;

    @Override
    public List<AdminProduct> getAllProducts() {
        return adminProductPort.findAll();
    }

    @Override
    @Transactional
    public void updateProductStatus(Long productId, String status) {
        adminProductPort.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        adminProductPort.updateStatus(productId, status);
    }
}
