package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.entity.UploadJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.UploadJpaRepository;
import com.farmbalance.shop.application.port.out.UploadRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 공통 업로드 파일 영속성 어댑터 (Output Port 구현).
 */
@Component
public class UploadPersistenceAdapter implements UploadRepository {

    private final UploadJpaRepository uploadJpaRepository;

    public UploadPersistenceAdapter(UploadJpaRepository uploadJpaRepository) {
        this.uploadJpaRepository = uploadJpaRepository;
    }

    @Override
    public void saveAll(String entityType, Long entityId, List<String> fileUrls) {
        List<UploadJpaEntity> entities = IntStream.range(0, fileUrls.size())
                .mapToObj(i -> new UploadJpaEntity(entityType, entityId, fileUrls.get(i), i))
                .collect(Collectors.toList());
        uploadJpaRepository.saveAll(entities);
    }

    @Override
    public List<String> findByEntity(String entityType, Long entityId) {
        return uploadJpaRepository
                .findByEntityTypeAndEntityIdAndDeletedAtIsNullOrderByDisplayOrderAsc(entityType, entityId)
                .stream()
                .map(UploadJpaEntity::getFileUrl)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByEntity(String entityType, Long entityId) {
        uploadJpaRepository.softDeleteByEntity(entityType, entityId);
    }
}
