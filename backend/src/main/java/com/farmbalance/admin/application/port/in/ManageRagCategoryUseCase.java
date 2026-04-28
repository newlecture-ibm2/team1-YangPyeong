package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.RagCategory;

import java.util.List;

/**
 * RAG 카테고리 관리 UseCase (Input Port)
 */
public interface ManageRagCategoryUseCase {

    List<RagCategory> getAllCategories();

    RagCategory getCategoryById(Long id);

    Long createCategory(String name, String description, Integer displayOrder);

    void updateCategory(Long id, String name, String description, Integer displayOrder, Boolean isActive);

    void deleteCategory(Long id);
}
