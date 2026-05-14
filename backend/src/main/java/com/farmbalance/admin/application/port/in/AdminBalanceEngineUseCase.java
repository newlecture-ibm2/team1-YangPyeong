package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.AdminBalanceData;
import java.util.List;

public interface AdminBalanceEngineUseCase {
    List<AdminBalanceData> getBalanceData();
    BalanceThresholdsDto getThresholds();
    void updateThresholds(BalanceThresholdsDto thresholds);

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    class BalanceThresholdsDto {
        private double excessWarn;
        private double excessCaution;
        private double shortCaution;
        private double shortWarn;
    }
}
