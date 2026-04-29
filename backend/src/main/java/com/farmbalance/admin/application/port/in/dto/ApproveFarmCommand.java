package com.farmbalance.admin.application.port.in.dto;

import com.farmbalance.farm.domain.CertificationStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApproveFarmCommand {
    private Long farmId;
    private CertificationStatus status;
}
