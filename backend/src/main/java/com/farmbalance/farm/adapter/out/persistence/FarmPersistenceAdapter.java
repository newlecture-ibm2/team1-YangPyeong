package com.farmbalance.farm.adapter.out.persistence;

import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.FarmJpaRepository;
import com.farmbalance.farm.application.port.out.DeleteFarmPort;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FarmPersistenceAdapter implements SaveFarmPort, LoadFarmPort, DeleteFarmPort {

    private final FarmJpaRepository farmJpaRepository;
    private final UserJpaRepository userJpaRepository;

    @Override
    public Farm saveFarm(Farm farm) {
        // 1. PNU 중복 검증 (수정 시에는 본인 제외)
        if (farm.getId() == null) {
            if (farmJpaRepository.existsByPnuCode(farm.getPnuCode())) {
                throw new com.farmbalance.farm.domain.exception.PnuAlreadyExistsException();
            }
        } else {
            farmJpaRepository.findByPnuCode(farm.getPnuCode())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(farm.getId())) {
                            throw new com.farmbalance.farm.domain.exception.PnuAlreadyExistsException();
                        }
                    });
        }

        FarmJpaEntity entity;
        if (farm.getId() == null) {
            // 신규 등록: UserJpaEntity 조회 및 새 Entity 생성
            UserJpaEntity userEntity = userJpaRepository.findById(farm.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + farm.getUserId()));

            entity = FarmJpaEntity.builder()
                    .user(userEntity)
                    .name(farm.getName())
                    .address(farm.getAddress())
                    .area(farm.getArea())
                    .cropTypes(farm.getCropTypes())
                    .bjdCode(farm.getBjdCode())
                    .pnuCode(farm.getPnuCode())
                    .latitude(farm.getLatitude())
                    .longitude(farm.getLongitude())
                    .registrationNumber(farm.getRegistrationNumber())
                    .documentUrl(farm.getDocumentUrl())
                    .soilType(farm.getSoilType())
                    .ph(farm.getPh())
                    .organicMatter(farm.getOrganicMatter())
                    .certificationStatus(farm.getCertificationStatus())
                    .build();
        } else {
            // 정보 수정: 기존 Entity 조회 및 필드 업데이트
            entity = farmJpaRepository.findById(farm.getId())
                    .orElseThrow(() -> new IllegalArgumentException("농장을 찾을 수 없습니다: " + farm.getId()));
            
            entity.update(
                    farm.getName(),
                    farm.getAddress(),
                    farm.getArea(),
                    farm.getCropTypes(),
                    farm.getBjdCode(),
                    farm.getPnuCode(),
                    farm.getLatitude(),
                    farm.getLongitude(),
                    farm.getRegistrationNumber(),
                    farm.getDocumentUrl(),
                    farm.getSoilType(),
                    farm.getPh(),
                    farm.getOrganicMatter()
            );
        }

        // 3. DB 저장 및 결과 반환
        FarmJpaEntity savedEntity = farmJpaRepository.save(entity);
        return mapToDomain(savedEntity);
    }

    @Override
    public List<Farm> loadFarmsByUserId(Long userId) {
        return farmJpaRepository.findAllByUserId(userId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Farm> loadFarmById(Long farmId) {
        return farmJpaRepository.findById(farmId)
                .map(this::mapToDomain);
    }

    private Farm mapToDomain(FarmJpaEntity entity) {
        return Farm.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .area(entity.getArea())
                .cropTypes(entity.getCropTypes() != null ? new java.util.ArrayList<>(entity.getCropTypes()) : new java.util.ArrayList<>())
                .bjdCode(entity.getBjdCode())
                .pnuCode(entity.getPnuCode())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .registrationNumber(entity.getRegistrationNumber())
                .documentUrl(entity.getDocumentUrl())
                .soilType(entity.getSoilType())
                .ph(entity.getPh())
                .organicMatter(entity.getOrganicMatter())
                .certificationStatus(entity.getCertificationStatus() != null ? entity.getCertificationStatus() : com.farmbalance.farm.domain.CertificationStatus.PENDING)
                .build();
    }

    @Override
    public List<Farm> loadAllFarms() {
        return farmJpaRepository.findAll().stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteFarm(Long farmId) {
        farmJpaRepository.deleteById(farmId);
    }
}
