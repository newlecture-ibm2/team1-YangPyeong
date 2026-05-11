package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminCropCategory;

import java.util.List;
import java.util.Optional;

/**
 * ADM-003 작물 카테고리 관리용 Output Port
 */
public interface AdminCropCategoryPort {

    List<AdminCropCategory> findAll();

    Optional<AdminCropCategory> findById(Long id);

    boolean existsByName(String name);

    boolean existsByNameExcludeId(String name, Long excludeId);
    Optional<AdminCropCategory> findByExternalId(String externalId);

    Long save(AdminCropCategory category);

    void update(AdminCropCategory category);

    void delete(Long id);
}
