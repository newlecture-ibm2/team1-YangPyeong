package com.farmbalance.recommend.application.port.out;

import org.springframework.web.multipart.MultipartFile;

public interface RecommendAiPort {
    /**
     * 작물 추천 사유 생성
     */
    String generateReason(String farmDetails, String cropName, String cropCategory);

    /**
     * 작물 병해충 이미지 진단
     */
    String diagnoseImage(MultipartFile image);
}
