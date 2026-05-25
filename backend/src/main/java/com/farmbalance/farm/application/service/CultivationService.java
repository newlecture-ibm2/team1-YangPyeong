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
        Farm farm = validateAvailableArea(command.getFarmId(), null, command.getCultivationArea());

        // 2. 도메인 객체 생성
        boolean inSeason = Boolean.TRUE.equals(command.getAlreadyPlanted())
                || command.getSowingDate() != null;
        CultivationRegistration registration = CultivationRegistration.builder()
                .farmId(command.getFarmId())
                .cropId(command.getCropId())
                .cultivationArea(command.getCultivationArea())
                .farmerEstimatedYield(command.getExpectedYield())
                .yieldUnit(command.getYieldUnit() != null ? command.getYieldUnit() : "kg")
                .sowingDate(command.getSowingDate())
                .inSeason(inSeason)
                .build();

        // 3. 저장
        CultivationRegistration saved = saveCultivationPort.addCultivationRegistration(registration);

        // 3-1. 수급 밸런스 등 후속 처리를 위해 작물명 포함 데이터 로드
        CultivationRegistration fullData = loadFarmPort.loadCultivationById(saved.getId())
                .orElse(saved); // 로드 실패 시 최소 정보라도 유지

        // 4. 공통 변경 이벤트 발행 (수급 밸런스, AI 정책, 예측 리포트 트리거용)
        eventPublisher.publishEvent(new com.farmbalance.farm.domain.event.CultivationChangedEvent(
                fullData.getId(),
                farm.getUserId(),
                fullData.getCropName(),
                null, // 신규 등록이므로 oldCropName은 없음
                "CREATED",
                java.time.LocalDateTime.now()
        ));

        // 5. 기존 히스토리 자동 생성 이벤트 발행 (하위 호환성 유지)
        eventPublisher.publishEvent(new CultivationRegisteredEvent(
                saved.getId(),
                farm.getUserId(),
                command.getFarmId(),
                command.getCropId(),
                fullData.getCropName(),
                command.getCultivationArea(),
                command.getSowingDate()
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
        // 이벤트를 위해 미리 정보 로드 (AFTER_COMMIT 시점에는 조회가 안 될 수 있으므로)
        loadFarmPort.loadCultivationById(id).ifPresent(cult -> {
            saveCultivationPort.deleteCultivationRegistration(id);

            // 1. 공통 변경 이벤트 발행 (수급 밸런스 반영을 위해 cropName 포함)
            eventPublisher.publishEvent(new com.farmbalance.farm.domain.event.CultivationChangedEvent(
                    id,
                    null, // 삭제의 경우 userId 생략 (필요하다면 Farm을 추가 조회)
                    cult.getCropName(),
                    cult.getCropName(), // 삭제 시에는 현재 작물이 곧 이전 작물
                    "DELETED",
                    java.time.LocalDateTime.now()
            ));

            // 2. 기존 삭제 이벤트 발행 (히스토리 자동 삭제용)
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
     * @return Farm 객체
     * @throws BusinessException 가용 면적을 초과하는 경우
     */
    private Farm validateAvailableArea(Long farmId, Long cultivationId, Double requestedArea) {
        // 1. 비관적 락을 적용하여 농장 조회 (동시성 제어)
        Farm farm = loadFarmPort.loadFarmByIdWithLock(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        if (requestedArea == null || requestedArea <= 0) {
            return farm; // 면적이 없으면 검증 불필요
        }

        if (farm.getArea() == null || farm.getArea() <= 0) {
            return farm; // 농장 면적이 미설정이면 검증 스킵
        }

        // 2. 현재 사용 중인 면적 합산 (수정 시 본인 면적 제외)
        Double currentUsedArea;
        if (cultivationId != null) {
            currentUsedArea = loadFarmPort.sumActiveAreaByFarmIdExcluding(farmId, cultivationId);
        } else {
            currentUsedArea = loadFarmPort.sumActiveAreaByFarmId(farmId);
        }

        // 3. 도메인 엔티티에 검증 위임 (운영 상태 및 면적 통합 검증)
        farm.validateCultivationArea(
                BigDecimal.valueOf(requestedArea),
                BigDecimal.valueOf(currentUsedArea != null ? currentUsedArea : 0.0)
        );
        
        return farm;
    }
}
