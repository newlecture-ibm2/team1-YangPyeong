package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminOrder;

import java.util.List;
import java.util.Optional;

/**
 * ADM-009 주문 관리용 Output Port
 */
public interface AdminOrderPort {

    List<AdminOrder> findAll();

    Optional<AdminOrder> findById(Long id);
}
