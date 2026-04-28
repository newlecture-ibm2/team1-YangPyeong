package com.farmbalance.farm.adapter.out.external;

import com.farmbalance.farm.application.port.out.UploadFilePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
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
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String savedFilename = UUID.randomUUID().toString() + extension;
            
            File dest = new File(dir, savedFilename);
            file.transferTo(dest);
            
            return "/uploads/" + savedFilename;
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        }
    }
}
