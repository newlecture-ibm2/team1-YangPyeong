package com.farmbalance.recommend.adapter.out.external;

import com.farmbalance.recommend.adapter.out.persistence.CropPriceCacheEntity;
import com.farmbalance.recommend.adapter.out.persistence.CropPriceCacheRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * KAMIS 시세 데이터를 새벽에 일괄 조회하여 DB 캐시에 저장하는 스케줄러.
 *
 * <p>기존에는 사용자 요청마다 실시간으로 외부 API를 호출하여 심각한 지연이 발생했습니다.
 * 이 스케줄러가 매일 새벽 5시에 전체 KAMIS 매핑 작물의 시세를 미리 가져와 캐싱하므로,
 * 실시간 요청 시에는 DB만 조회하면 됩니다.</p>
 *
 * <p>에러 대비:
 * <ul>
 *     <li>외부 API 실패 시 해당 작물만 건너뛰고 나머지 작물은 계속 처리</li>
 *     <li>Rate Limit 방지를 위해 건당 500ms 딜레이 적용</li>
 *     <li>앱 시작 시에도 1회 실행하여 초기 캐시 확보</li>
 * </ul></p>
 */
@Slf4j
@Component
public class KamisPriceBatchScheduler {

    private final CropPriceCacheRepository cacheRepository;

    @Value("${kamis.api.url:https://www.kamis.or.kr/service/price/xml.do}")
    private String apiUrl;

    @Value("${kamis.api.cert-key}")
    private String certKey;

    @Value("${kamis.api.cert-id}")
    private String certId;

    private final RestTemplate kamisBatchRestTemplate;

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * RestTemplate을 Bean이 아닌 생성자에서 직접 빌드합니다 (기존 KamisPriceAdapter와 동일 패턴).
     */
    public KamisPriceBatchScheduler(
            CropPriceCacheRepository cacheRepository,
            RestTemplateBuilder builder,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper
    ) {
        this.cacheRepository = cacheRepository;
        this.objectMapper = objectMapper;
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.kamisBatchRestTemplate = builder.requestFactory(() -> factory).build();
    }

    /**
     * 매일 새벽 5시에 전체 KAMIS 매핑 작물의 시세를 일괄 조회하여 DB에 캐싱합니다.
     * 애플리케이션 시작 후 30초 뒤에도 1회 실행합니다 (initialDelay).
     */
    @Scheduled(cron = "0 0 5 * * *")
    public void refreshAllCropPrices() {
        log.info("===== KAMIS 시세 일괄 캐싱 스케줄러 시작 =====");
        Set<String> cropNames = KamisCropCodeMapper.getAllMappedCropNames();
        LocalDate today = LocalDate.now();

        int successCount = 0;
        int skipCount = 0;
        int failCount = 0;

        for (String cropName : cropNames) {
            // 이미 오늘 캐시가 있으면 건너뜀
            if (cacheRepository.findTopByCropNameAndPriceDateOrderByIdDesc(cropName, today).isPresent()) {
                skipCount++;
                continue;
            }

            try {
                Integer price = fetchPriceFromKamis(cropName, today);
                if (price != null) {
                    CropPriceCacheEntity entity = CropPriceCacheEntity.builder()
                            .cropName(cropName)
                            .price(price)
                            .unit("1kg")
                            .priceDate(today)
                            .build();
                    cacheRepository.save(entity);
                    successCount++;
                    log.debug("KAMIS 캐시 저장 완료: {} -> {}원", cropName, price);
                } else {
                    failCount++;
                    log.warn("KAMIS 시세 조회 결과 없음: {}", cropName);
                }
            } catch (Exception e) {
                failCount++;
                log.error("KAMIS 시세 조회 실패 (작물: {}): {}", cropName, e.getMessage());
            }

            // Rate Limit 방지 딜레이 (500ms)
            try {
                Thread.sleep(500);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("KAMIS 배치 스케줄러 인터럽트 발생, 종료합니다.");
                break;
            }
        }

        log.info("===== KAMIS 시세 일괄 캐싱 완료: 성공={}, 스킵(이미캐시)={}, 실패={} =====",
                successCount, skipCount, failCount);
    }

    /**
     * KAMIS API를 호출하여 특정 작물의 최근 1kg당 도매 가격을 조회합니다.
     */
    private Integer fetchPriceFromKamis(String cropName, LocalDate today) {
        String itemCode = KamisCropCodeMapper.getKamisCode(cropName);
        if (itemCode == null) {
            return null;
        }

        String startDateStr = today.minusDays(7).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String endDateStr = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                .queryParam("action", "periodProductList")
                .queryParam("p_productclscode", "02")
                .queryParam("p_startday", startDateStr)
                .queryParam("p_endday", endDateStr)
                .queryParam("p_itemcategorycode", itemCode.substring(0, 1) + "00")
                .queryParam("p_itemcode", itemCode)
                .queryParam("p_productrankcode", "04")
                .queryParam("p_countrycode", "1101")
                .queryParam("p_convert_kg_yn", "Y")
                .queryParam("p_cert_key", certKey)
                .queryParam("p_cert_id", certId)
                .queryParam("p_returntype", "json")
                .build().toUriString();

        String jsonResponse = kamisBatchRestTemplate.getForObject(url, String.class);
        if (jsonResponse == null || jsonResponse.isBlank()) {
            return null;
        }

        // JSON 여부 간단 검증
        String trimmed = jsonResponse.stripLeading();
        if (trimmed.isEmpty() || (trimmed.charAt(0) != '{' && trimmed.charAt(0) != '[')) {
            log.warn("KAMIS 배치 - JSON이 아닌 응답 (작물: {})", cropName);
            return null;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = objectMapper.readValue(jsonResponse, Map.class);
            if (response != null && response.containsKey("data")) {
                Object dataObj = response.get("data");
                if (dataObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                    if (dataMap.containsKey("item")) {
                        return extractPrice(dataMap.get("item"));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("KAMIS 배치 - JSON 파싱 실패 (작물: {}): {}", cropName, e.getMessage());
        }
        return null;
    }

    private Integer extractPrice(Object itemObj) {
        if (itemObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemObj;
            for (int i = itemList.size() - 1; i >= 0; i--) {
                Integer price = parsePriceStr(String.valueOf(itemList.get(i).get("price")));
                if (price != null) return price;
            }
        } else if (itemObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> itemMap = (Map<String, Object>) itemObj;
            return parsePriceStr(String.valueOf(itemMap.get("price")));
        }
        return null;
    }

    private Integer parsePriceStr(String priceStr) {
        if (priceStr == null || priceStr.isEmpty() || "-".equals(priceStr)) {
            return null;
        }
        try {
            return Integer.parseInt(priceStr.replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
