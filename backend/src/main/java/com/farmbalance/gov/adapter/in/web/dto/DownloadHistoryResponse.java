package com.farmbalance.gov.adapter.in.web.dto;
import com.farmbalance.gov.domain.model.DownloadHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class DownloadHistoryResponse {
    private final Long id;
    private final Long userId;
    private final String type;
    private final String format;
    private final LocalDateTime createdAt;

    public static DownloadHistoryResponse from(DownloadHistory h) {
        return DownloadHistoryResponse.builder()
            .id(h.getId())
            .userId(h.getUserId())
            .type(h.getType())
            .format(h.getFormat())
            .createdAt(h.getCreatedAt())
            .build();
    }
}
