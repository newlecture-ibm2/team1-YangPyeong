package com.farmbalance.community.adapter.out.persistence;

import com.farmbalance.community.adapter.out.persistence.entity.PostCategoryEntity;
import com.farmbalance.community.adapter.out.persistence.entity.PostEntity;
import com.farmbalance.community.adapter.out.persistence.repository.PostCategoryJpaRepository;
import com.farmbalance.community.adapter.out.persistence.repository.PostJpaRepository;
import com.farmbalance.community.application.port.out.LoadPostCategoryPort;
import com.farmbalance.community.application.port.out.PostPort;
import com.farmbalance.community.domain.model.Post;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PostPersistenceAdapter implements PostPort, LoadPostCategoryPort {

    private final PostJpaRepository postJpaRepository;
    private final PostCategoryJpaRepository categoryJpaRepository;

    @Override
    public Post save(Post post) {
        PostCategoryEntity category = categoryJpaRepository.findById(post.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + post.getCategoryId()));

        PostEntity entity = PostEntity.fromDomain(post, category);
        return postJpaRepository.save(entity).toDomain();
    }

    @Override
    public Optional<Post> findById(Long id) {
        return postJpaRepository.findById(id).map(PostEntity::toDomain);
    }

    @Override
    public Optional<Post> findActiveById(Long id) {
        return postJpaRepository.findActiveById(id).map(PostEntity::toDomain);
    }

    @Override
    public Map<Long, String> findActiveTitlesByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        return postJpaRepository.findActiveTitlesByIds(ids).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (String) row[1]
                ));
    }

    @Override
    public Page<Post> findByFilters(List<Long> categoryIds, String keyword, String searchType, Pageable pageable) {
        // 공지글(isNotice=true)이 항상 최상단에 오도록 정렬 조건 앞에 isNotice DESC 추가
        Sort noticeFirst = Sort.by(Sort.Direction.DESC, "isNotice");
        Sort combinedSort = noticeFirst.and(pageable.getSort());
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), combinedSort);
        Page<PostEntity> entityPage;
        
        String type = searchType != null ? searchType : "all";
        
        switch (type) {
            case "title":
                entityPage = postJpaRepository.findByFiltersTitle(categoryIds, keyword, sortedPageable);
                break;
            case "content":
                entityPage = postJpaRepository.findByFiltersContent(categoryIds, keyword, sortedPageable);
                break;
            default:
                entityPage = postJpaRepository.findByFilters(categoryIds, keyword, sortedPageable);
                break;
        }
        
        return entityPage.map(PostEntity::toDomain);
    }

    @Override
    public Page<Post> findByAuthorIdAndStatus(Long authorId, String status, Pageable pageable) {
        return postJpaRepository.findByAuthorIdAndStatus(authorId, status, pageable).map(PostEntity::toDomain);
    }

    @Override
    public void deleteById(Long id) {
        postJpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id) {
        return categoryJpaRepository.existsById(id);
    }

    @Override
    public String findNameById(Long id) {
        return categoryJpaRepository.findById(id)
                .map(PostCategoryEntity::getName)
                .orElse("알 수 없음");
    }

    @Override
    public List<PostCategoryEntity> loadAllCategories() {
        return categoryJpaRepository.findAll();
    }
}
