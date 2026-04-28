package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.GovUserInfo;

public interface GetGovUserInfoUseCase {
    GovUserInfo getGovUserInfo(Long userId);
}
