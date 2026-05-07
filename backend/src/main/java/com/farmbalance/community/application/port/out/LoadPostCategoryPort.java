package com.farmbalance.community.application.port.out;

import com.farmbalance.community.adapter.out.persistence.entity.PostCategoryEntity;

import java.util.List;
import java.util.Optional;

public interface LoadPostCategoryPort {
    boolean existsById(Long id);
    String findNameById(Long id);
    List<PostCategoryEntity> loadAllCategories();
}
