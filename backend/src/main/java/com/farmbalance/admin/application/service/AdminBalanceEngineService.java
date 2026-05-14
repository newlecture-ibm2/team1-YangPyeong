package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.AdminBalanceEngineUseCase;
import com.farmbalance.admin.application.port.out.AdminBalanceDataPort;
import com.farmbalance.admin.domain.AdminBalanceData;
import com.farmbalance.balance.application.service.BalanceProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminBalanceEngineService implements AdminBalanceEngineUseCase {

    private final AdminBalanceDataPort adminBalanceDataPort;
    private final BalanceProperties balanceProperties;

    @Override
    public List<AdminBalanceData> getBalanceData() {
        return adminBalanceDataPort.findAll();
    }

    @Override
    public BalanceThresholdsDto getThresholds() {
        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();
        return new BalanceThresholdsDto(
                thresholds.getExcessWarn(),
                thresholds.getExcessCaution(),
                thresholds.getShortCaution(),
                thresholds.getShortWarn()
        );
    }

    @Override
    @CacheEvict(value = "supplyTrends", allEntries = true)
    public void updateThresholds(BalanceThresholdsDto dto) {
        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();
        thresholds.setExcessWarn(dto.getExcessWarn());
        thresholds.setExcessCaution(dto.getExcessCaution());
        thresholds.setShortCaution(dto.getShortCaution());
        thresholds.setShortWarn(dto.getShortWarn());
        
        System.out.println("[Balance-Engine] Hot Reloaded Thresholds: " + dto);
        // Note: AI Server weight broadcast has been removed per recent plan decisions.
    }
}
