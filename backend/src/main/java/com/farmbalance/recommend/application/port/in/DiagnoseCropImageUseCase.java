package com.farmbalance.recommend.application.port.in;

import org.springframework.web.multipart.MultipartFile;

/**
 * 작물 이미지 진단 유스케이스
 */
public interface DiagnoseCropImageUseCase {
    /**
     * 작물 이미지를 분석하여 병해충 여부 진단
     */
    String diagnose(Long userId, MultipartFile image);
}
