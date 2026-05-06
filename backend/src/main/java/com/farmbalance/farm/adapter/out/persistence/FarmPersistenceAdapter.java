package com.farmbalance.farm.adapter.out.persistence;

import com.farmbalance.farm.adapter.out.persistence.entity.CultivationRegistrationJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.CultivationRegistrationJpaRepository;
import com.farmbalance.farm.adapter.out.persistence.repository.FarmJpaRepository;
import com.farmbalance.farm.application.port.out.DeleteFarmPort;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveCultivationPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FarmPersistenceAdapter implements SaveFarmPort, LoadFarmPort, DeleteFarmPort, SaveCultivationPort {

    private final FarmJpaRepository farmJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final CultivationRegistrationJpaRepository cultivationRepository;
    private final JdbcTemplate jdbcTemplate;

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

        // 3. DB 저장
        FarmJpaEntity savedEntity = farmJpaRepository.save(entity);

        // (기존 farm_crops 갱신 로직 삭제됨. 작물 등록은 별도의 cultivation_registrations를 통해 수행)

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

    /**
     * cultivation_registrations + crops JOIN으로 작물명 목록 조회
     */
    private List<String> loadCropNames(Long farmId) {
        String sql = "SELECT c.name FROM cultivation_registrations cr JOIN crops c ON c.id = cr.crop_id WHERE cr.farm_id = ? AND cr.deleted_at IS NULL ORDER BY c.name";
        return jdbcTemplate.queryForList(sql, String.class, farmId);
    }

    /**
     * cultivation_registrations에서 crop_id 목록 조회
     */
    private List<Long> loadCropIds(Long farmId) {
        String sql = "SELECT crop_id FROM cultivation_registrations WHERE farm_id = ? AND deleted_at IS NULL";
        return jdbcTemplate.queryForList(sql, Long.class, farmId);
    }

    private Farm mapToDomain(FarmJpaEntity entity) {
        return Farm.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .area(entity.getArea())
                .cropIds(loadCropIds(entity.getId()))
                .cropNames(loadCropNames(entity.getId()))
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

    @Override
    public void saveCultivationRegistrations(Long farmId, List<CultivationRegistration> registrations) {
        if (registrations == null || registrations.isEmpty()) {
            return;
        }

        // 기존 재배 등록 소프트 삭제
        List<CultivationRegistrationJpaEntity> existing = cultivationRepository.findByFarmIdAndDeletedAtIsNull(farmId);
        existing.forEach(CultivationRegistrationJpaEntity::softDelete);
        cultivationRepository.saveAll(existing);

        // 새 재배 등록 저장
        List<CultivationRegistrationJpaEntity> entities = registrations.stream()
                .map(reg -> CultivationRegistrationJpaEntity.builder()
                        .farmId(farmId)
                        .cropId(reg.getCropId())
                        .cultivationArea(reg.getCultivationArea() != null ? BigDecimal.valueOf(reg.getCultivationArea()) : null)
                        .farmerEstimatedYield(reg.getFarmerEstimatedYield() != null ? BigDecimal.valueOf(reg.getFarmerEstimatedYield()) : null)
                        .yieldUnit(reg.getYieldUnit() != null ? reg.getYieldUnit() : "kg")
                        .build())
                .collect(Collectors.toList());
        cultivationRepository.saveAll(entities);
    }

    @Override
    public CultivationRegistration addCultivationRegistration(CultivationRegistration reg) {
        CultivationRegistrationJpaEntity entity = CultivationRegistrationJpaEntity.builder()
                .farmId(reg.getFarmId())
                .cropId(reg.getCropId())
                .cultivationArea(reg.getCultivationArea() != null ? BigDecimal.valueOf(reg.getCultivationArea()) : null)
                .farmerEstimatedYield(reg.getFarmerEstimatedYield() != null ? BigDecimal.valueOf(reg.getFarmerEstimatedYield()) : null)
                .yieldUnit(reg.getYieldUnit() != null ? reg.getYieldUnit() : "kg")
                .build();

        CultivationRegistrationJpaEntity saved = cultivationRepository.save(entity);

        return CultivationRegistration.builder()
                .id(saved.getId())
                .farmId(saved.getFarmId())
                .cropId(saved.getCropId())
                .cultivationArea(saved.getCultivationArea() != null ? saved.getCultivationArea().doubleValue() : null)
                .farmerEstimatedYield(saved.getFarmerEstimatedYield() != null ? saved.getFarmerEstimatedYield().doubleValue() : null)
                .yieldUnit(saved.getYieldUnit())
                .build();
    }
    @Override
    public List<CultivationRegistration> loadCultivationsByFarmId(Long farmId) {
        String sql = """
            SELECT cr.id, cr.farm_id, cr.crop_id, c.name as crop_name, 
                   cr.cultivation_area, cr.farmer_estimated_yield, cr.yield_unit
            FROM cultivation_registrations cr
            JOIN crops c ON cr.crop_id = c.id
            WHERE cr.farm_id = ? AND cr.deleted_at IS NULL
            """;
        
        return jdbcTemplate.query(sql, (rs, rowNum) -> CultivationRegistration.builder()
                .id(rs.getLong("id"))
                .farmId(rs.getLong("farm_id"))
                .cropId(rs.getLong("crop_id"))
                .cropName(rs.getString("crop_name"))
                .cultivationArea(rs.getBigDecimal("cultivation_area") != null ? rs.getBigDecimal("cultivation_area").doubleValue() : null)
                .farmerEstimatedYield(rs.getBigDecimal("farmer_estimated_yield") != null ? rs.getBigDecimal("farmer_estimated_yield").doubleValue() : null)
                .yieldUnit(rs.getString("yield_unit"))
                .build(), farmId);
    }

    @Override
    public Optional<CultivationRegistration> loadCultivationById(Long id) {
        String sql = """
            SELECT cr.id, cr.farm_id, cr.crop_id, c.name as crop_name, 
                   cr.cultivation_area, cr.farmer_estimated_yield, cr.yield_unit
            FROM cultivation_registrations cr
            JOIN crops c ON cr.crop_id = c.id
            WHERE cr.id = ? AND cr.deleted_at IS NULL
            """;
        
        List<CultivationRegistration> list = jdbcTemplate.query(sql, (rs, rowNum) -> CultivationRegistration.builder()
                .id(rs.getLong("id"))
                .farmId(rs.getLong("farm_id"))
                .cropId(rs.getLong("crop_id"))
                .cropName(rs.getString("crop_name"))
                .cultivationArea(rs.getBigDecimal("cultivation_area") != null ? rs.getBigDecimal("cultivation_area").doubleValue() : null)
                .farmerEstimatedYield(rs.getBigDecimal("farmer_estimated_yield") != null ? rs.getBigDecimal("farmer_estimated_yield").doubleValue() : null)
                .yieldUnit(rs.getString("yield_unit"))
                .build(), id);
                
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
