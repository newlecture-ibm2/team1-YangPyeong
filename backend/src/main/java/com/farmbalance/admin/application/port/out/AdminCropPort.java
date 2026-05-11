package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminCrop;

import java.util.List;
import java.util.Optional;

/**
 * 작물 마스터 관리용 Output Port (CRUD)
 */
public interface AdminCropPort {

    List<AdminCrop> findAll();

    List<AdminCrop> findByFilter(Long categoryId, String keyword);

    Optional<AdminCrop> findById(Long id);

    boolean existsByName(String name);

    boolean existsByNameExcludeId(String name, Long excludeId);
    Optional<AdminCrop> findByExternalId(String externalId);

    Long save(AdminCrop crop);

    void update(AdminCrop crop);

    void delete(Long id);
}
