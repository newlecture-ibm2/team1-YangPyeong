package com.farmbalance.recommend.application.port.in;

import org.springframework.web.multipart.MultipartFile;

public interface DiagnoseCropImageUseCase {
    String diagnose(Long userId, MultipartFile image);
}
