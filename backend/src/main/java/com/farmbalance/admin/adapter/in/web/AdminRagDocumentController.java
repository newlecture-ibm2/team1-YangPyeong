package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.CreateRagDocumentRequest;
import com.farmbalance.admin.adapter.in.web.dto.UpdateRagDocumentRequest;
import com.farmbalance.admin.application.port.in.ManageRagDocumentUseCase;
import com.farmbalance.admin.domain.RagDocument;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RAG 문서 관리 Controller (Driving Adapter)
 * API URL: /api/admins/rag/documents
 */
@RestController
@RequestMapping("/api/admins/rag/documents")
@RequiredArgsConstructor
public class AdminRagDocumentController {

    private final ManageRagDocumentUseCase manageRagDocumentUseCase;

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

    /** 문서 생성 */
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
}
