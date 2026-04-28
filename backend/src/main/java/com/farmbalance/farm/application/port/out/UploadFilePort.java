package com.farmbalance.farm.application.port.out;

import org.springframework.web.multipart.MultipartFile;

public interface UploadFilePort {
    String upload(MultipartFile file);
}
