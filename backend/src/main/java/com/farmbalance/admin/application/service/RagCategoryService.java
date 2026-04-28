package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageRagCategoryUseCase;
import com.farmbalance.admin.application.port.out.AdminRagCategoryPort;
import com.farmbalance.admin.domain.RagCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RAG 카테고리 관리 서비스 (UseCase 구현체)
 * 도메인 객체만 사용하며, DTO나 JPA Entity에 직접 의존하지 않습니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RagCategoryService implements ManageRagCategoryUseCase {

    private final AdminRagCategoryPort adminRagCategoryPort;

    @Override
    public List<RagCategory> getAllCategories() {
        return adminRagCategoryPort.findAll();
    }

    @Override
    public RagCategory getCategoryById(Long id) {
        return adminRagCategoryPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RAG 카테고리를 찾을 수 없습니다. id=" + id));
    }

    @Override
    @Transactional
    public Long createCategory(String name, String description, Integer displayOrder) {
        RagCategory category = RagCategory.builder()
                .name(name)
                .description(description)
                .displayOrder(displayOrder != null ? displayOrder : 0)
                .isActive(true)
                .build();
        return adminRagCategoryPort.save(category);
    }

    @Override
    @Transactional
    public void updateCategory(Long id, String name, String description, Integer displayOrder, Boolean isActive) {
        // 존재 여부 확인
        RagCategory existing = getCategoryById(id);

        RagCategory updated = RagCategory.builder()
                .id(existing.getId())
                .name(name != null ? name : existing.getName())
                .description(description != null ? description : existing.getDescription())
                .displayOrder(displayOrder != null ? displayOrder : existing.getDisplayOrder())
                .isActive(isActive != null ? isActive : existing.getIsActive())
                .build();

        adminRagCategoryPort.update(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        // 존재 여부 확인
        getCategoryById(id);
        adminRagCategoryPort.delete(id);
    }
}
