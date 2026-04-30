package com.farmbalance.global.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
public class LocalUploadFileAdapter implements UploadFilePort {

    @Value("${file.upload.dir:uploads/}")
    private String uploadDir;

    @Override
    public String upload(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
        
        try {
            // 상대 경로를 절대 경로로 변환 (프로젝트 루트 기준)
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String savedFilename = UUID.randomUUID().toString() + extension;
            
            Path dest = dir.resolve(savedFilename);
            file.transferTo(dest.toFile());
            
            return "/uploads/" + savedFilename;
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        }
    }
}

