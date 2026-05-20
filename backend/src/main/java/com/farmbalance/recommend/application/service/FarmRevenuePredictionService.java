package com.farmbalance.recommend.application.service;

import com.farmbalance.recommend.adapter.out.persistence.FarmRevenuePredictionEntity;
import com.farmbalance.recommend.adapter.out.persistence.FarmRevenuePredictionRepository;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort;
import com.farmbalance.recommend.application.support.RevenuePredictionQuality;
import com.farmbalance.recommend.application.support.RevenuePredictionRowKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmRevenuePredictionService {

    private final FarmRevenuePredictionRepository repository;
    private final LoadFarmForRecommendPort loadFarmForRecommendPort;

    @Transactional
    public void savePrediction(Long userId, Long farmId, Map<String, Object> request, Map<String, Object> aiResponse) {
        if (farmId == null || aiResponse == null || RevenuePredictionQuality.isWeak(aiResponse)) {
            return;
        }
        validateFarmOwnership(userId, farmId);

        String cropName = stringVal(request.get("crop_name"));
        if (cropName.isEmpty()) {
            cropName = stringVal(aiResponse.get("crop_name"));
        }
        double areaSqm = num(request.get("area_sqm"));
        if (areaSqm <= 0) {
            areaSqm = num(aiResponse.get("area_sqm"));
        }
        Integer sowingMonth = intOrNull(request.get("sowing_month"));
        Double actualYield = doubleOrNull(request.get("actual_yield_kg"));

        String rowKey = RevenuePredictionRowKey.build(cropName, areaSqm, sowingMonth, actualYield);

        Optional<FarmRevenuePredictionEntity> existing =
                repository.findByFarmIdAndCacheRowKey(farmId, rowKey);
        if (existing.isPresent()) {
            existing.get().updateFromSnapshot(aiResponse);
            log.debug("수익 예측 DB 갱신: farmId={}, crop={}", farmId, cropName);
        } else {
            repository.save(FarmRevenuePredictionEntity.fromSnapshot(
                    farmId, rowKey, cropName, areaSqm, sowingMonth, actualYield, aiResponse));
            log.debug("수익 예측 DB 저장: farmId={}, crop={}", farmId, cropName);
        }
    }

    public List<Map<String, Object>> listByFarm(Long userId, Long farmId) {
        validateFarmOwnership(userId, farmId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (FarmRevenuePredictionEntity entity : repository.findByFarmIdOrderByPredictedAtDesc(farmId)) {
            Map<String, Object> map = new LinkedHashMap<>(entity.toResponseMap());
            if (!RevenuePredictionQuality.isWeak(map)) {
                out.add(map);
            }
        }
        return out;
    }

    private void validateFarmOwnership(Long userId, Long farmId) {
        if (userId == null) {
            throw new AuthenticationCredentialsNotFoundException("인증 정보가 없습니다.");
        }
        if (!loadFarmForRecommendPort.isOwnedBy(farmId, userId)) {
            throw new AccessDeniedException("해당 농장에 대한 접근 권한이 없습니다: farmId=" + farmId);
        }
    }

    private static String stringVal(Object o) {
        return o != null ? o.toString().trim() : "";
    }

    private static double num(Object o) {
        if (o instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return o != null ? Double.parseDouble(o.toString()) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static Integer intOrNull(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Double doubleOrNull(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return Double.parseDouble(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
