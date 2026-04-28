package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminCrop;

import java.util.List;
import java.util.Optional;

/**
 * ADM-003 작물 마스터 관리용 Output Port
 */
public interface AdminCropPort {

    List<AdminCrop> findAll();

    Optional<AdminCrop> findById(Long id);

    Long save(AdminCrop crop);

    void update(AdminCrop crop);

    void deactivate(Long id);
}
