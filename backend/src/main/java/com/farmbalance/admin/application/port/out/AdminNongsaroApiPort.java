package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.adapter.out.external.nongsaro.dto.WorkScheduleGrpDto;
import com.farmbalance.admin.adapter.out.external.nongsaro.dto.WorkScheduleLstDto;

import java.util.List;

public interface AdminNongsaroApiPort {
    List<WorkScheduleGrpDto> getWorkScheduleGroupList();
    List<WorkScheduleLstDto> getWorkScheduleList(String kidofcomdtySeCode);
}
