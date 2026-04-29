package com.farmbalance.gov.adapter.in.web.dto;
import com.farmbalance.gov.domain.model.GovUserInfo;
public record GovUserResponse(Long id, String name, String role, String region, String regionCode, String regionName) {
    public static GovUserResponse from(GovUserInfo info) {
        return new GovUserResponse(info.id(), info.name(), info.role(), info.region(), info.regionCode(), info.regionName());
    }
}

