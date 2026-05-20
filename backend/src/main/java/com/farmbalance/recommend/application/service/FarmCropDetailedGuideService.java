package com.farmbalance.recommend.application.service;

import com.farmbalance.recommend.adapter.out.persistence.FarmCropDetailedGuideEntity;
import com.farmbalance.recommend.adapter.out.persistence.FarmCropDetailedGuideRepository;
import com.farmbalance.recommend.application.port.out.LoadFarmCultivationContextPort;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.application.support.CropGuideCacheKey;
import com.farmbalance.recommend.application.support.CropGuideExperienceResolver;
import com.farmbalance.recommend.application.support.CropGuideQuality;
import com.farmbalance.recommend.application.support.FarmRecommendDetailsBuilder;
import com.farmbalance.recommend.domain.FarmCultivationContext;
import com.farmbalance.recommend.domain.RecommendMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmCropDetailedGuideService {

    private final FarmCropDetailedGuideRepository repository;
    private final LoadFarmForRecommendPort loadFarmForRecommendPort;
    private final LoadFarmCultivationContextPort loadFarmCultivationContextPort;
    private final FarmRecommendDetailsBuilder farmRecommendDetailsBuilder;

    public Optional<Map<String, Object>> getCached(
            Long userId,
            Long farmId,
            long cropId,
            Map<String, Object> requestHints
    ) {
        validateFarmOwnership(userId, farmId);
        FarmCultivationContext ctx = loadFarmCultivationContextPort.loadByFarmId(farmId);
        String experienceLevel = CropGuideExperienceResolver.resolve(cropId, requestHints, ctx);
        String cacheKey = CropGuideCacheKey.build(cropId, experienceLevel);
        return repository.findByFarmIdAndCacheKey(farmId, cacheKey)
                .filter(e -> e.getGuideVersion() == CropGuideCacheKey.GUIDE_VERSION)
                .map(FarmCropDetailedGuideEntity::toResponseMap);
    }

    @Transactional
    public Map<String, Object> saveFromAi(
            Long userId,
            Long farmId,
            long cropId,
            Map<String, Object> request,
            Map<String, Object> aiResponse
    ) {
        validateFarmOwnership(userId, farmId);
        if (!CropGuideQuality.isValid(aiResponse)) {
            throw new IllegalArgumentException("AI 재배 가이드 응답이 유효하지 않습니다.");
        }

        FarmCultivationContext ctx = loadFarmCultivationContextPort.loadByFarmId(farmId);
        String experienceLevel = CropGuideExperienceResolver.resolve(cropId, request, ctx);
        request.put("experience_level", experienceLevel);
        String cropName = stringVal(aiResponse.get("crop_name"));
        if (cropName.isEmpty()) {
            cropName = stringVal(request.get("crop_name"));
        }
        String cacheKey = CropGuideCacheKey.build(cropId, experienceLevel);

        Optional<FarmCropDetailedGuideEntity> existing =
                repository.findByFarmIdAndCacheKey(farmId, cacheKey);
        if (existing.isPresent()) {
            existing.get().updateFromSnapshot(aiResponse);
            log.debug("재배 가이드 DB 갱신: farmId={}, cropId={}, exp={}", farmId, cropId, experienceLevel);
        } else {
            repository.save(FarmCropDetailedGuideEntity.fromAiSnapshot(
                    farmId,
                    cropId,
                    cropName,
                    experienceLevel,
                    CropGuideCacheKey.GUIDE_VERSION,
                    cacheKey,
                    aiResponse));
            log.debug("재배 가이드 DB 저장: farmId={}, cropId={}, exp={}", farmId, cropId, experienceLevel);
        }

        LinkedHashMap<String, Object> out = new LinkedHashMap<>(aiResponse);
        out.put("crop_id", cropId);
        out.put("experience_level", experienceLevel);
        out.put("guide_version", CropGuideCacheKey.GUIDE_VERSION);
        out.put("source", "ai");
        return out;
    }

    public void enrichRequestForAi(Long farmId, long cropId, Map<String, Object> request) {
        FarmCultivationContext ctx = loadFarmCultivationContextPort.loadByFarmId(farmId);
        String experienceLevel = CropGuideExperienceResolver.resolve(cropId, request, ctx);
        request.put("experience_level", experienceLevel);
        RecommendMode mode = CropGuideExperienceResolver.resolveRecommendMode(request, ctx);

        loadFarmForRecommendPort.loadFarmBasic(farmId).ifPresent(farm -> {
            putIfAbsent(request, "farm_name", farm.getName());
            putIfAbsent(request, "farm_address", farm.getAddress());
            if (farm.getPh() != null) {
                putIfAbsent(request, "soil_ph", farm.getPh());
            }
            if (farm.getOrganicMatter() != null) {
                putIfAbsent(request, "organic_matter", farm.getOrganicMatter());
            }
            if (farm.getSoilType() != null) {
                putIfAbsent(request, "soil_type", farm.getSoilType());
            }
            if (!request.containsKey("farm_details") || stringVal(request.get("farm_details")).isEmpty()) {
                request.put(
                        "farm_details",
                        farmRecommendDetailsBuilder.build(farm, ctx, mode, null));
            }
        });
        request.putIfAbsent("farm_id", farmId);
    }

    private void validateFarmOwnership(Long userId, Long farmId) {
        if (userId == null) {
            throw new AuthenticationCredentialsNotFoundException("인증 정보가 없습니다.");
        }
        if (!loadFarmForRecommendPort.isOwnedBy(farmId, userId)) {
            throw new AccessDeniedException("해당 농장에 대한 접근 권한이 없습니다: farmId=" + farmId);
        }
    }

    private static void putIfAbsent(Map<String, Object> map, String key, Object value) {
        if (value != null && !map.containsKey(key)) {
            map.put(key, value);
        }
    }

    private static String stringVal(Object o) {
        return o != null ? o.toString().trim() : "";
    }
}
