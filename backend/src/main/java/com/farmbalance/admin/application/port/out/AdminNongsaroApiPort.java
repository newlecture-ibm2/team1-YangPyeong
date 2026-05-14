package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.application.port.out.dto.AdminNongsaroCropGroupDto;
import com.farmbalance.admin.application.port.out.dto.AdminNongsaroCropDto;

import java.util.List;

public interface AdminNongsaroApiPort {
    List<AdminNongsaroCropGroupDto> getWorkScheduleGroupList();
    List<AdminNongsaroCropDto> getWorkScheduleList(String groupExternalId);
}
