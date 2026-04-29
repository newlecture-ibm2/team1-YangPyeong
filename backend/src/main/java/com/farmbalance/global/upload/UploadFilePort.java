package com.farmbalance.global.upload;

import org.springframework.web.multipart.MultipartFile;

public interface UploadFilePort {
    String upload(MultipartFile file);
}
