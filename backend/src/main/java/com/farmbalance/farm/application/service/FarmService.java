package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.RegisterFarmCommand;
import com.farmbalance.farm.application.port.in.RegisterFarmUseCase;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.exception.FarmNotFoundException;
import com.farmbalance.farm.domain.util.PnuGeneratorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FarmService implements RegisterFarmUseCase, LoadFarmUseCase {

    private final SaveFarmPort saveFarmPort;
    private final LoadFarmPort loadFarmPort;

    @Override
    public Farm registerFarm(RegisterFarmCommand command) {
        // 1. PNU 코드 생성 유틸리티 호출
        String pnuCode = PnuGeneratorUtil.generate(
                command.getBjdCode(), 
                command.isMountain(), 
                command.getMainNo(), 
                command.getSubNo()
        );

        // 2. 도메인 객체 생성 (순수 자바 객체)
        Farm farm = Farm.builder()
                .userId(command.getUserId())
                .name(command.getName())
                .address(command.getAddress())
                .area(command.getArea())
                .cropType(command.getCropType())
                .bjdCode(command.getBjdCode())
                .pnuCode(pnuCode)
                .build();

        // 3. 영속성 어댑터(Output Port) 호출하여 DB 저장
        return saveFarmPort.saveFarm(farm);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Farm> loadFarmsByUserId(Long userId) {
        return loadFarmPort.loadFarmsByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Farm loadFarmDetail(Long farmId) {
        return loadFarmPort.loadFarmById(farmId)
                .orElseThrow(FarmNotFoundException::new);
    }
}
