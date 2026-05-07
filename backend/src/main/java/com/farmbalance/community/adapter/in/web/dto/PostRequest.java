package com.farmbalance.community.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    private Long categoryId;
    @jakarta.validation.constraints.Size(max = 100, message = "제목은 100자 이내로 입력해주세요.")
    private String title;
    @jakarta.validation.constraints.Size(max = 5000, message = "내용은 5000자 이내로 입력해주세요.")
    private String content;
    private boolean isNotice;
}
