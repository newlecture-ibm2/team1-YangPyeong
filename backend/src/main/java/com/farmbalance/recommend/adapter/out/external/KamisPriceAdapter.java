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
        String itemCode = KamisCropCodeMapper.getKamisCode(cropName);
        if (itemCode == null) {
            log.warn("KAMIS 매핑 코드가 없는 작물입니다: {}", cropName);
            return null;
        }

        LocalDate today = LocalDate.now();

        // 1. 오늘 날짜 캐시 확인
        Optional<CropPriceCacheEntity> todayCache =
                cacheRepository.findTopByCropNameAndPriceDateOrderByIdDesc(cropName, today);
        if (todayCache.isPresent()) {
            return todayCache.get().getPrice();
        }

        // 2. 오늘 캐시가 없으면 가장 최근 캐시로 폴백
        Optional<CropPriceCacheEntity> latestCache =
                cacheRepository.findTopByCropNameOrderByPriceDateDesc(cropName);
        if (latestCache.isPresent()) {
            log.debug("오늘 캐시 없음, 최근 캐시 사용: {} (날짜: {})", cropName, latestCache.get().getPriceDate());
            return latestCache.get().getPrice();
        }

        log.warn("KAMIS 캐시 데이터 없음: {} — 배치 스케줄러 실행 전이거나 API 조회에 실패했을 수 있습니다.", cropName);
        return null;
    }
}

