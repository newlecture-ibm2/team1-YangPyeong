package com.farmbalance.shop.application.port.out;

import java.util.List;

/**
 * 공통 업로드 파일 영속성 Port (Output Port).
 */
public interface UploadRepository {

    /** 파일 URL 목록 저장 */
    void saveAll(String entityType, Long entityId, List<String> fileUrls);

    /** 해당 엔티티의 파일 URL 목록 조회 */
    List<String> findByEntity(String entityType, Long entityId);

    /** 해당 엔티티의 파일 전체 삭제 (soft delete) */
    void deleteByEntity(String entityType, Long entityId);
}
