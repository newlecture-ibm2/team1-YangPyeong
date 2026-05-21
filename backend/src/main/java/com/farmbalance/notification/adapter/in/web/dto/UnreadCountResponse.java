package com.farmbalance.notification.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 읽지 않은 알림 수 응답 DTO (헤더 벨 뱃지용)
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UnreadCountResponse {
    private long unreadCount;
}
