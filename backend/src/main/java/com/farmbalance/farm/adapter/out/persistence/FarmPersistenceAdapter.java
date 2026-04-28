package com.farmbalance.farm.adapter.out.persistence;

import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.FarmJpaRepository;
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
public class FarmPersistenceAdapter implements SaveFarmPort, LoadFarmPort {

    private final FarmJpaRepository farmJpaRepository;
    private final UserJpaRepository userJpaRepository;

    @Override
    public Farm saveFarm(Farm farm) {
        // 1. PNU 중복 검증
        if (farmJpaRepository.existsByPnuCode(farm.getPnuCode())) {
            throw new com.farmbalance.farm.domain.exception.PnuAlreadyExistsException();
        }

        // 2. 연관된 UserJpaEntity 조회 (User 도메인의 Repository 사용)
        UserJpaEntity userEntity = userJpaRepository.findById(farm.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + farm.getUserId()));

        // 3. Domain -> JpaEntity 매핑 (Builder 활용)
        FarmJpaEntity entity = FarmJpaEntity.builder()
                .user(userEntity)
                .name(farm.getName())
                .address(farm.getAddress())
                .area(farm.getArea())
                .cropType(farm.getCropType())
                .bjdCode(farm.getBjdCode())
                .pnuCode(farm.getPnuCode())
                .build();

        // 4. DB 저장
        FarmJpaEntity savedEntity = farmJpaRepository.save(entity);

        // 5. JpaEntity -> Domain 변환 후 반환
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
                .cropType(entity.getCropType())
                .bjdCode(entity.getBjdCode())
                .pnuCode(entity.getPnuCode())
                .build();
    }
}
