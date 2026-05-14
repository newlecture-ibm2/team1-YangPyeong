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
        // 논리적 예외 방어 (API 방어)
        if (dto.getShortWarn() >= dto.getShortCaution() ||
            dto.getShortCaution() >= 100 ||
            dto.getExcessCaution() <= 100 ||
            dto.getExcessCaution() >= dto.getExcessWarn()) {
            throw new IllegalArgumentException("올바르지 않은 임계치 제약조건입니다.");
        }

        // 메모리 변수 즉시 반영
        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();
        thresholds.setExcessWarn(dto.getExcessWarn());
        thresholds.setExcessCaution(dto.getExcessCaution());
        thresholds.setShortCaution(dto.getShortCaution());
        thresholds.setShortWarn(dto.getShortWarn());
        
        System.out.println("[Balance-Engine] Hot Reloaded Thresholds: " + dto);

        // balance_data 테이블의 전체 작물 상태(balance_status) 일괄 갱신
        adminBalanceDataPort.updateBalanceStatuses(
                dto.getExcessWarn(),
                dto.getExcessCaution(),
                dto.getShortWarn(),
                dto.getShortCaution()
        );
        System.out.println("[Balance-Engine] Updated all balance_data statuses in database.");
    }
}
