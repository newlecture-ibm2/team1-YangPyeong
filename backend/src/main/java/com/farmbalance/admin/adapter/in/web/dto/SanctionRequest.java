package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SanctionRequest {
    private boolean deleteContent;
    private boolean suspendUser;
}
