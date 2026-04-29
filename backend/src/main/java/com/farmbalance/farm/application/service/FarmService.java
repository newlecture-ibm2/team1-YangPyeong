package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.DeleteFarmUseCase;
import com.farmbalance.farm.application.port.out.DeleteFarmPort;
import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.RegisterFarmCommand;
import com.farmbalance.farm.application.port.in.RegisterFarmUseCase;
import com.farmbalance.farm.application.port.in.UpdateFarmCommand;
import com.farmbalance.farm.application.port.in.UpdateFarmUseCase;

import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;

import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.CertificationStatus;
import com.farmbalance.farm.domain.exception.FarmNotFoundException;
import com.farmbalance.farm.domain.util.PnuGeneratorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FarmService implements RegisterFarmUseCase, LoadFarmUseCase, UpdateFarmUseCase, DeleteFarmUseCase {

    private final SaveFarmPort saveFarmPort;
    private final LoadFarmPort loadFarmPort;
    private final DeleteFarmPort deleteFarmPort;

    @Override
    public Farm registerFarm(RegisterFarmCommand command) {
        // 1. PNU 코드 생성 유틸리티 호출
        String pnuCode = PnuGeneratorUtil.generate(
                command.getBjdCode(), 
                command.isMountain(), 
                command.getMainNo(), 
                command.getSubNo()
        );



        // 2. 도메인 객체 생성 (좌표는 프론트엔드 카카오 Maps JS SDK에서 변환하여 전달받음)
        Farm farm = Farm.builder()
                .userId(command.getUserId())
                .name(command.getName())
                .address(command.getAddress())
                .area(command.getArea())
                .cropTypes(command.getCropTypes())
                .bjdCode(command.getBjdCode())
                .pnuCode(pnuCode)
                .latitude(command.getLatitude())
                .longitude(command.getLongitude())
                .registrationNumber(command.getRegistrationNumber())
                .documentUrl(command.getDocumentUrl())
                .certificationStatus(CertificationStatus.PENDING)
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
    public Farm loadFarmDetail(Long farmId) {
        return loadFarmPort.loadFarmById(farmId)
                .orElseThrow(FarmNotFoundException::new);
    }

    @Override
    public Farm updateFarm(UpdateFarmCommand command) {
        // 1. 기존 농장 정보 조회
        Farm farm = loadFarmPort.loadFarmById(command.getFarmId())
                .orElseThrow(FarmNotFoundException::new);

        // 2. PNU 재계산 (주소 구성 요소가 전달된 경우)
        String newPnuCode = farm.getPnuCode();
        if (command.getBjdCode() != null) {
            newPnuCode = PnuGeneratorUtil.generate(
                    command.getBjdCode(),
                    command.isMountain(),
                    command.getMainNo(),
                    command.getSubNo()
            );
        }

        // 3. 좌표는 기존 값 유지 (프론트엔드에서 수정 시 좌표를 같이 전달하도록 추후 개선)
        Double newLat = farm.getLatitude();
        Double newLng = farm.getLongitude();

        // 4. 도메인 객체 업데이트
        farm.updateInfo(
                command.getName(),
                command.getAddress(),
                command.getArea(),
                command.getCropTypes(),
                command.getBjdCode(),
                newPnuCode,
                newLat,
                newLng,
                command.getRegistrationNumber(),
                command.getDocumentUrl()
        );

        // 5. 저장 (Output Port 호출)
        return saveFarmPort.saveFarm(farm);
    }

    @Override
    public void deleteFarm(Long farmId) {
        // 존재 여부 확인
        if (!loadFarmPort.loadFarmById(farmId).isPresent()) {
            throw new FarmNotFoundException();
        }
        deleteFarmPort.deleteFarm(farmId);
    }
}

