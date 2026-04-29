package com.farmbalance.global.upload;

import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class GlobalUploadController {

    private final UploadFilePort uploadFilePort;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileUrl = uploadFilePort.upload(file);
        return ResponseEntity.ok(ApiResponse.ok(fileUrl));
    }
}
