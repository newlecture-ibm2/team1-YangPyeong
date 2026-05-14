package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateNoticeRequest {
    private String title;
    private String content;
    private Long categoryId;
}
