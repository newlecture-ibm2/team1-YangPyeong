package com.farmbalance.recommend.adapter.out.external;

import com.farmbalance.recommend.adapter.out.persistence.CropPriceCacheEntity;
import com.farmbalance.recommend.adapter.out.persistence.CropPriceCacheRepository;
import com.farmbalance.recommend.application.port.out.RecommendPricePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

/**
 * KAMIS 시세 조회 어댑터 — DB 캐시 전용.
 *
 * <p>실시간 KAMIS API 호출은 {@link KamisPriceBatchScheduler}가 새벽 배치로 처리합니다.
 * 이 어댑터는 오직 DB 캐시만 조회하므로 응답 시간이 1ms 이내로 단축됩니다.</p>
 *
 * <p>캐시 조회 우선순위:
 * <ol>
 *     <li>오늘 날짜의 캐시 데이터</li>
 *     <li>가장 최근 날짜의 캐시 데이터 (폴백)</li>
 *     <li>캐시 없음 → null 반환 (후보 작물 기본값 사용)</li>
 * </ol></p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KamisPriceAdapter implements RecommendPricePort {

    private final CropPriceCacheRepository cacheRepository;

    @Override
    public Integer getRecentPricePerKg(String cropName) {
        KamisCropNameResolver.ResolveResult resolved = KamisCropNameResolver.resolve(cropName);
        String cacheKey = resolved.standardName();
        if (cacheKey == null) {
            log.warn("KAMIS 매핑 코드가 없는 작물입니다: {}", cropName);
            return null;
        }
        if (!resolved.exactMatch()) {
            log.info("KAMIS 시세 조회: {} → 표준 품목 {}", cropName, cacheKey);
        }

        LocalDate today = LocalDate.now();

        Optional<CropPriceCacheEntity> todayCache =
                cacheRepository.findTopByCropNameAndPriceDateOrderByIdDesc(cacheKey, today);
        if (todayCache.isPresent()) {
            return todayCache.get().getPrice();
        }

        Optional<CropPriceCacheEntity> latestCache =
                cacheRepository.findTopByCropNameOrderByPriceDateDesc(cacheKey);
        if (latestCache.isPresent()) {
            log.debug("오늘 캐시 없음, 최근 캐시 사용: {} (날짜: {})", cacheKey, latestCache.get().getPriceDate());
            return latestCache.get().getPrice();
        }

        log.warn("KAMIS 캐시 데이터 없음: {} (표준: {})", cropName, cacheKey);
        return null;
    }
}

