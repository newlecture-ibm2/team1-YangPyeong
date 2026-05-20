package com.farmbalance.notification.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.notification.adapter.in.web.dto.NotificationPreferenceResponse;
import com.farmbalance.notification.adapter.in.web.dto.NotificationPreferenceUpdateRequest;
import com.farmbalance.notification.adapter.in.web.dto.NotificationResponse;
import com.farmbalance.notification.adapter.in.web.dto.UnreadCountResponse;
import com.farmbalance.notification.application.port.in.NotificationPreferenceUseCase;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 알림 API 컨트롤러
 */
@Tag(name = "알림", description = "알림 조회 및 읽음 처리 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationUseCase notificationUseCase;
    private final NotificationPreferenceUseCase preferenceUseCase;

    @Operation(summary = "내 알림 목록 조회", description = "type, isRead 필터 + 페이징 지원")
    @GetMapping
    public ApiResponse<List<NotificationResponse>> getNotifications(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Long userId = SecurityUtil.getCurrentUserId();
        Page<NotificationResponse> result = notificationUseCase.getNotifications(userId, type, isRead, pageable)
                .map(NotificationResponse::fromDomain);

        return ApiResponse.ok(
                result.getContent(),
                ApiResponse.Meta.of(result.getNumber(), result.getSize(), result.getTotalElements())
        );
    }

    @Operation(summary = "읽지 않은 알림 수 조회", description = "헤더 벨 뱃지 표시용")
    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> getUnreadCount() {
        Long userId = SecurityUtil.getCurrentUserId();
        long count = notificationUseCase.getUnreadCount(userId);
        return ApiResponse.ok(UnreadCountResponse.builder().unreadCount(count).build());
    }

    @Operation(summary = "개별 알림 읽음 처리")
    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        notificationUseCase.markAsRead(id, userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "전체 알림 읽음 처리")
    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        Long userId = SecurityUtil.getCurrentUserId();
        notificationUseCase.markAllAsRead(userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "내 알림 수신 설정 조회",
            description = "카테고리별 on/off 설정을 반환합니다. 설정이 없으면 모두 활성화된 기본값을 반환합니다.")
    @GetMapping("/preferences")
    public ApiResponse<NotificationPreferenceResponse> getPreferences() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(NotificationPreferenceResponse.fromDomain(preferenceUseCase.getPreference(userId)));
    }

    @Operation(summary = "내 알림 수신 설정 업데이트",
            description = "전송한 필드만 부분 업데이트됩니다. null 필드는 기존 값 유지.")
    @PatchMapping("/preferences")
    public ApiResponse<NotificationPreferenceResponse> updatePreferences(
            @RequestBody NotificationPreferenceUpdateRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(NotificationPreferenceResponse.fromDomain(
                preferenceUseCase.updatePreference(userId, request.toCommand())
        ));
    }
}
