package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.application.port.in.dto.ApproveFarmCommand;

public interface ApproveFarmUseCase {
    void approveFarm(ApproveFarmCommand command);
}
