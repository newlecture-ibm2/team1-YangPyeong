package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.DeleteFarmUseCase;
import com.farmbalance.farm.application.port.out.DeleteFarmPort;
import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.RegisterFarmCommand;
import com.farmbalance.farm.application.port.in.RegisterFarmUseCase;
import com.farmbalance.farm.application.port.in.UpdateFarmCommand;
import com.farmbalance.farm.application.port.in.UpdateFarmUseCase;

import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveCultivationPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import com.farmbalance.farm.domain.event.FarmRegisteredEvent;
import org.springframework.context.ApplicationEventPublisher;
import com.farmbalance.farm.domain.CertificationStatus;
import com.farmbalance.farm.domain.exception.FarmNotFoundException;
import com.farmbalance.farm.domain.util.PnuGeneratorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FarmService implements RegisterFarmUseCase, LoadFarmUseCase, UpdateFarmUseCase, DeleteFarmUseCase {

    private final SaveFarmPort saveFarmPort;
    private final LoadFarmPort loadFarmPort;
    private final DeleteFarmPort deleteFarmPort;
    private final SaveCultivationPort saveCultivationPort;
    private final ApplicationEventPublisher eventPublisher;

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
                .cropIds(command.getCropIds())
                .bjdCode(command.getBjdCode())
                .pnuCode(pnuCode)
                .latitude(command.getLatitude())
                .longitude(command.getLongitude())
                .documents(command.getDocuments())
                .soilType(command.getSoilType())
                .ph(command.getPh())
                .organicMatter(command.getOrganicMatter())
                .certificationStatus(CertificationStatus.PENDING)
                .build();

        // 3. 영속성 어댑터(Output Port) 호출하여 DB 저장
        Farm savedFarm = saveFarmPort.saveFarm(farm);

        // 4. 재배 등록 상세 저장 (cultivations 데이터가 있는 경우)
        if (command.getCultivations() != null && !command.getCultivations().isEmpty()) {
            List<CultivationRegistration> registrations = command.getCultivations().stream()
                    .map(c -> CultivationRegistration.builder()
                            .farmId(savedFarm.getId())
                            .cropId(c.getCropId())
                            .cultivationArea(c.getArea())
                            .farmerEstimatedYield(c.getExpectedYield())
                            .yieldUnit("kg")
                            .build())
                    .collect(java.util.stream.Collectors.toList());
            List<CultivationRegistration> savedRegistrations = saveCultivationPort.saveCultivationRegistrations(savedFarm.getId(), registrations);
            
            // 각 재배 등록별 히스토리 자동 생성 이벤트 발행
            for (CultivationRegistration reg : savedRegistrations) {
                eventPublisher.publishEvent(new CultivationRegisteredEvent(
                        reg.getId(),
                        savedFarm.getId(),
                        reg.getCropId(),
                        reg.getCultivationArea()
                ));
            }
        }

        // 5. 비동기 이력 저장을 위한 이벤트 발행
        eventPublisher.publishEvent(new FarmRegisteredEvent(
                savedFarm.getId(),
                savedFarm.getName()
        ));

        return savedFarm;
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

        // 2. PNU 재계산 (정보가 넘어온 경우에만 갱신, 없으면 기존값 유지)
        String newBjdCode = (command.getBjdCode() != null && !command.getBjdCode().isBlank()) 
                ? command.getBjdCode() : farm.getBjdCode();
        String newMainNo = (command.getMainNo() != null && !command.getMainNo().isBlank()) 
                ? command.getMainNo() : (farm.getPnuCode() != null && farm.getPnuCode().length() == 19 ? farm.getPnuCode().substring(11, 15) : "0001");
        String newSubNo = (command.getSubNo() != null && !command.getSubNo().isBlank()) 
                ? command.getSubNo() : (farm.getPnuCode() != null && farm.getPnuCode().length() == 19 ? farm.getPnuCode().substring(15, 19) : "0000");
        boolean isMountain = command.isMountain();

        String newPnuCode = farm.getPnuCode();
        if (newBjdCode != null && !newBjdCode.isBlank()) {
            newPnuCode = PnuGeneratorUtil.generate(
                    newBjdCode,
                    isMountain,
                    newMainNo,
                    newSubNo
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
                command.getCropIds(),
                newBjdCode,
                newPnuCode,
                newLat,
                newLng,
                command.getDocuments(),
                null, // documentData는 OCR 파싱 후 서버에서 채움
                command.getSoilType(),
                command.getPh(),
                command.getOrganicMatter()
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
    @Override
    public List<CultivationRegistration> loadCultivationsByFarmId(Long farmId) {
        return loadFarmPort.loadCultivationsByFarmId(farmId);
    }
}

