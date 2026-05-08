package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.*;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveCultivationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.event.CultivationDeletedEvent;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * 재배 관리 서비스 (Application Service)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CultivationService implements RegisterCultivationUseCase, UpdateCultivationUseCase, DeleteCultivationUseCase, LoadCultivationUseCase {

    private final SaveCultivationPort saveCultivationPort;
    private final LoadFarmPort loadFarmPort;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public CultivationRegistration registerCultivation(RegisterCultivationCommand command) {
        // 1. 면적 검증 (비관적 락 적용)
        validateAvailableArea(command.getFarmId(), null, command.getCultivationArea());

        // 2. 도메인 객체 생성
        CultivationRegistration registration = CultivationRegistration.builder()
                .farmId(command.getFarmId())
                .cropId(command.getCropId())
                .cultivationArea(command.getCultivationArea())
                .farmerEstimatedYield(command.getExpectedYield())
                .yieldUnit(command.getYieldUnit() != null ? command.getYieldUnit() : "kg")
                .build();

        // 3. 저장
        CultivationRegistration saved = saveCultivationPort.addCultivationRegistration(registration);

        // 4. 히스토리 자동 생성 이벤트 발행
        eventPublisher.publishEvent(new CultivationRegisteredEvent(
                saved.getId(),
                command.getFarmId(),
                command.getCropId(),
                command.getCultivationArea()
        ));

        return saved;
    }

    @Override
    public CultivationRegistration updateCultivation(UpdateCultivationCommand command) {
        // 1. 기존 재배 정보 조회 (farmId 확인용)
        CultivationRegistration existing = loadFarmPort.loadCultivationById(command.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SEED_NOT_FOUND));

        // 2. 면적 검증 (본인 기존 면적 제외)
        validateAvailableArea(existing.getFarmId(), command.getId(), command.getCultivationArea());

        // 3. 수정
        CultivationRegistration registration = CultivationRegistration.builder()
                .id(command.getId())
                .cropId(command.getCropId())
                .cultivationArea(command.getCultivationArea())
                .farmerEstimatedYield(command.getExpectedYield())
                .yieldUnit(command.getYieldUnit() != null ? command.getYieldUnit() : "kg")
                .build();

        saveCultivationPort.updateCultivationRegistration(registration);
        
        return registration;
    }

    @Override
    public void deleteCultivation(Long id) {
        // 이벤트를 위해 미리 정보 로드
        loadFarmPort.loadCultivationById(id).ifPresent(cult -> {
            saveCultivationPort.deleteCultivationRegistration(id);
            // 삭제 이벤트 발행
            eventPublisher.publishEvent(new CultivationDeletedEvent(id, cult.getFarmId()));
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<CultivationRegistration> getCultivationsByFarmId(Long farmId) {
        // LoadFarmPort를 통해 농장별 재배 목록 조회
        return loadFarmPort.loadCultivationsByFarmId(farmId);
    }

    // ── 면적 검증 Private 메서드 ──

    /**
     * 재배 면적이 농장 전체 면적을 초과하지 않는지 검증합니다.
     *
     * @param farmId          농장 ID
     * @param cultivationId   수정 시 본인의 재배 등록 ID (신규 등록 시 null)
     * @param requestedArea   등록/수정하려는 면적 (㎡)
     * @throws BusinessException 가용 면적을 초과하는 경우
     */
    private void validateAvailableArea(Long farmId, Long cultivationId, Double requestedArea) {
        if (requestedArea == null || requestedArea <= 0) {
            return; // 면적이 없으면 검증 불필요
        }

        // 1. 비관적 락을 적용하여 농장 조회 (동시성 제어)
        Farm farm = loadFarmPort.loadFarmByIdWithLock(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        if (farm.getArea() == null || farm.getArea() <= 0) {
            return; // 농장 면적이 미설정이면 검증 스킵
        }

        // 2. 현재 사용 중인 면적 합산 (수정 시 본인 면적 제외)
        Double currentUsedArea;
        if (cultivationId != null) {
            currentUsedArea = loadFarmPort.sumActiveAreaByFarmIdExcluding(farmId, cultivationId);
        } else {
            currentUsedArea = loadFarmPort.sumActiveAreaByFarmId(farmId);
        }

        // 3. BigDecimal로 변환하여 정밀 계산 (소수점 둘째 자리까지 반올림하여 부동 소수점 오차 방지)
        BigDecimal totalArea = BigDecimal.valueOf(farm.getArea()).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal usedArea = BigDecimal.valueOf(currentUsedArea).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal newArea = BigDecimal.valueOf(requestedArea).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal totalAfterAdd = usedArea.add(newArea);

        // 4. 초과 여부 검증 (오차 범위 0.01㎡ 허용을 위해 소수점 둘째 자리 비교)
        if (totalAfterAdd.compareTo(totalArea) > 0) {
            BigDecimal availableArea = totalArea.subtract(usedArea);
            throw new BusinessException(
                    ErrorCode.FARM_AREA_EXCEEDED,
                    String.format("가용 면적이 부족합니다. (농장 전체: %.2f㎡, 이미 사용중: %.2f㎡, 남은 면적: %.2f㎡, 요청 면적: %.2f㎡)",
                            totalArea.doubleValue(), usedArea.doubleValue(), availableArea.doubleValue(), requestedArea)
            );
        }
    }
}
