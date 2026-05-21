package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.CreateRagDocumentRequest;
import com.farmbalance.admin.adapter.in.web.dto.UpdateRagDocumentRequest;
import com.farmbalance.admin.application.port.in.ManageRagDocumentUseCase;
import com.farmbalance.admin.domain.RagDocument;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

/**
 * RAG 문서 관리 Controller (Driving Adapter)
 * API URL: /api/admin/rag/documents
 */
@RestController
@RequestMapping("/api/admin/rag/documents")
@RequiredArgsConstructor
public class AdminRagDocumentController {

    private final ManageRagDocumentUseCase manageRagDocumentUseCase;

    @Value("${app.upload.rag-dir:./uploads/rag}")
    private String uploadDir;

    /** 전체 문서 조회 (카테고리 필터 가능) */
    @GetMapping
    public ApiResponse<List<RagDocument>> getDocuments(
            @RequestParam(required = false) Long categoryId) {
        if (categoryId != null) {
            return ApiResponse.ok(manageRagDocumentUseCase.getDocumentsByCategoryId(categoryId));
        }
        return ApiResponse.ok(manageRagDocumentUseCase.getAllDocuments());
    }

    /** 문서 단건 조회 */
    @GetMapping("/{id}")
    public ApiResponse<RagDocument> getDocumentById(@PathVariable Long id) {
        return ApiResponse.ok(manageRagDocumentUseCase.getDocumentById(id));
    }

    /** 문서 생성 (텍스트 — JSON) */
    @PostMapping
    public ApiResponse<Long> createDocument(@RequestBody CreateRagDocumentRequest request) {
        // TODO: 인증된 관리자의 userId를 SecurityContext에서 가져오도록 변경
        Long userId = 1L;
        Long id = manageRagDocumentUseCase.createDocument(
                userId, request.getCategoryId(), request.getTitle(),
                request.getContentType(), request.getTextContent(),
                request.getFileUrl(), request.getFileName(), request.getFileType());
        return ApiResponse.ok(id);
    }

    /** 문서 생성 (파일 업로드 — multipart/form-data) */
    @PostMapping("/upload")
    public ApiResponse<Long> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("title") String title,
            @RequestParam("contentType") String contentType,
            @RequestParam(value = "fileType", required = false) String fileType) throws IOException {

        // 업로드 디렉토리 생성
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 고유 파일명 생성 (UUID + 원본 확장자)
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : "";
        String storedName = UUID.randomUUID() + extension;

        // 파일 저장
        Path filePath = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), filePath);

        // 파일 타입 자동 판별 (미입력 시)
        String resolvedFileType = fileType;
        if (resolvedFileType == null || resolvedFileType.isBlank()) {
            resolvedFileType = extension.replace(".", "").toUpperCase();
            if (resolvedFileType.isEmpty()) resolvedFileType = "PDF";
        }

        // DB 저장
        Long userId = 1L; // TODO: SecurityContext에서 가져오기
        String fileUrl = "/uploads/rag/" + storedName;
        Long id = manageRagDocumentUseCase.createDocument(
                userId, categoryId, title,
                contentType, null,
                fileUrl, originalName, resolvedFileType);
        return ApiResponse.ok(id);
    }

    /** 문서 수정 */
    @PatchMapping("/{id}")
    public ApiResponse<Void> updateDocument(@PathVariable Long id,
                                            @RequestBody UpdateRagDocumentRequest request) {
        manageRagDocumentUseCase.updateDocument(
                id, request.getCategoryId(), request.getTitle(),
                request.getContentType(), request.getTextContent(),
                request.getFileUrl(), request.getFileName(), request.getFileType());
        return ApiResponse.ok(null);
    }

    /** 문서 삭제 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id) {
        manageRagDocumentUseCase.deleteDocument(id);
        return ApiResponse.ok(null);
    }

    /** AI 서버와 RAG 데이터 동기화 */
    @PostMapping("/sync")
    public ApiResponse<Boolean> syncRagData() {
        boolean result = manageRagDocumentUseCase.syncRagData();
        return ApiResponse.ok(result);
    }
}

