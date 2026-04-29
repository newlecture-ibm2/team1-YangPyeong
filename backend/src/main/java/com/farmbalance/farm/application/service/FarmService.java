package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.DeleteFarmUseCase;
import com.farmbalance.farm.application.port.out.DeleteFarmPort;
import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.RegisterFarmCommand;
import com.farmbalance.farm.application.port.in.RegisterFarmUseCase;
import com.farmbalance.farm.application.port.in.UpdateFarmCommand;
import com.farmbalance.farm.application.port.in.UpdateFarmUseCase;
import com.farmbalance.farm.application.port.out.GetCoordinatesPort;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.Coordinates;
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
    private final GetCoordinatesPort getCoordinatesPort;

    @Override
    public Farm registerFarm(RegisterFarmCommand command) {
        // 1. PNU 코드 생성 유틸리티 호출
        String pnuCode = PnuGeneratorUtil.generate(
                command.getBjdCode(), 
                command.isMountain(), 
                command.getMainNo(), 
                command.getSubNo()
        );

        // 2. 카카오 주소 검색 API를 통해 위도/경도 조회
        Coordinates coordinates = getCoordinatesPort.getCoordinates(command.getAddress());

        // 3. 도메인 객체 생성 (순수 자바 객체)
        Farm farm = Farm.builder()
                .userId(command.getUserId())
                .name(command.getName())
                .address(command.getAddress())
                .area(command.getArea())
                .cropTypes(command.getCropTypes())
                .bjdCode(command.getBjdCode())
                .pnuCode(pnuCode)
                .latitude(coordinates.getLatitude())
                .longitude(coordinates.getLongitude())
                .registrationNumber(command.getRegistrationNumber())
                .documentUrl(command.getDocumentUrl())
                .certificationStatus(CertificationStatus.PENDING)
                .build();

        // 4. 영속성 어댑터(Output Port) 호출하여 DB 저장
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

        // 3. 좌표 갱신 (주소가 변경된 경우)
        Double newLat = farm.getLatitude();
        Double newLng = farm.getLongitude();
        if (command.getAddress() != null && !command.getAddress().equals(farm.getAddress())) {
            Coordinates coordinates = getCoordinatesPort.getCoordinates(command.getAddress());
            newLat = coordinates.getLatitude();
            newLng = coordinates.getLongitude();
        }

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

