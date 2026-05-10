package com.farmbalance.recommend.application.port.out;

/**
 * AI 서버와 통신하기 위한 아웃고잉 포트
 */
public interface RecommendAiPort {
    /**
     * 특정 작물에 대한 AI 추천 사유 생성
     */
    String generateReason(String farmDetails, String cropName, String cropCategory);

    /**
     * 작물 병해충 이미지 진단
     */
    String diagnoseImage(org.springframework.web.multipart.MultipartFile image);
}
