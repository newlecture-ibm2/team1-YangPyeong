package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class BulkDeleteRequest {
    @NotEmpty(message = "삭제할 ID 목록이 비어있습니다.")
    private List<Long> ids;
}
