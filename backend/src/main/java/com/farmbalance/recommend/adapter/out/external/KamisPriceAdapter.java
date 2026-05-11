package com.farmbalance.recommend.adapter.out.external;

import com.farmbalance.recommend.adapter.out.persistence.CropPriceCacheEntity;
import com.farmbalance.recommend.adapter.out.persistence.CropPriceCacheRepository;
import com.farmbalance.recommend.application.port.out.RecommendPricePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class KamisPriceAdapter implements RecommendPricePort {

    private final RestTemplate restTemplate;
    private final CropPriceCacheRepository cacheRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public KamisPriceAdapter(RestTemplateBuilder builder, CropPriceCacheRepository cacheRepository, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.restTemplate = builder.build();
        this.cacheRepository = cacheRepository;
        this.objectMapper = objectMapper;
    }

    @Value("${kamis.api.url:https://www.kamis.or.kr/service/price/xml.do}")
    private String apiUrl;

    @Value("${kamis.api.cert-key}")
    private String certKey;

    @Value("${kamis.api.cert-id}")
    private String certId;

    @Override
    public Integer getRecentPricePerKg(String cropName) {
        String itemCode = KamisCropCodeMapper.getKamisCode(cropName);
        if (itemCode == null) {
            log.warn("KAMIS 매핑 코드가 없는 작물입니다: {}", cropName);
            return null;
        }

        LocalDate today = LocalDate.now();

        // 1. 캐시 테이블 확인 (오늘 날짜)
        Optional<CropPriceCacheEntity> cachedOpt = cacheRepository.findTopByCropNameAndPriceDateOrderByIdDesc(cropName, today);
        if (cachedOpt.isPresent()) {
            log.info("KAMIS 가격 캐시 적중: {} -> {}원", cropName, cachedOpt.get().getPrice());
            return cachedOpt.get().getPrice();
        }

        // 2. KAMIS API 호출
        // KAMIS는 주말/공휴일 가격이 없을 수 있으므로 당일 조회가 원칙이되, 
        // 최신 가격을 응답해주는 기능이 있습니다.
        try {
            String startDateStr = today.minusDays(7).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String endDateStr = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            
            String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                    .queryParam("action", "periodProductList")
                    .queryParam("p_productclscode", "02") // 02: 도매
                    .queryParam("p_startday", startDateStr)
                    .queryParam("p_endday", endDateStr)
                    .queryParam("p_itemcategorycode", itemCode.substring(0, 1) + "00") // 품목부류코드
                    .queryParam("p_itemcode", itemCode)
                    .queryParam("p_productrankcode", "04") // 등급: 04 (상품)
                    .queryParam("p_countrycode", "1101") // 1101: 서울
                    .queryParam("p_convert_kg_yn", "Y") // 1kg 단위로 환산 여부
                    .queryParam("p_cert_key", certKey)
                    .queryParam("p_cert_id", certId)
                    .queryParam("p_returntype", "json")
                    .build().toUriString();

            String jsonResponse = restTemplate.getForObject(url, String.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = objectMapper.readValue(jsonResponse, Map.class);


            if (response != null && response.containsKey("data")) {
                Object dataObj = response.get("data");
                if (dataObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                    if (dataMap.containsKey("item")) {
                        Object itemObj = dataMap.get("item");
                        Integer price = extractPriceFromItem(itemObj, itemCode);
                        
                        if (price != null) {
                            // 3. DB 캐싱 저장
                            CropPriceCacheEntity newCache = CropPriceCacheEntity.builder()
                                    .cropName(cropName)
                                    .price(price)
                                    .unit("1kg")
                                    .priceDate(today)
                                    .build();
                            cacheRepository.save(newCache);
                            
                            log.info("KAMIS API 가격 조회 성공 및 캐시 저장: {} -> {}원", cropName, price);
                            return price;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("KAMIS API 통신 중 오류 발생 (작물: {})", cropName, e);
        }

        // 4. 오늘 조회가 실패했다면, 기존 캐시에 저장된 가장 최근 가격이라도 반환 (Fallback)
        return cacheRepository.findTopByCropNameOrderByPriceDateDesc(cropName)
                .map(CropPriceCacheEntity::getPrice)
                .orElse(null);
    }

    private Integer extractPriceFromItem(Object itemObj, String itemCode) {
        if (itemObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemObj;
            
            // 가장 최근 날짜의 가격을 얻기 위해 리스트의 마지막부터 탐색
            for (int i = itemList.size() - 1; i >= 0; i--) {
                Map<String, Object> item = itemList.get(i);
                String priceStr = String.valueOf(item.get("price"));
                if (priceStr != null && !priceStr.isEmpty() && !"-".equals(priceStr)) {
                    try {
                        return Integer.parseInt(priceStr.replace(",", ""));
                    } catch (NumberFormatException e) {
                        log.warn("KAMIS 가격 파싱 오류: {}", priceStr);
                    }
                }
            }
        } else if (itemObj instanceof Map) {
            // 결과가 1건일 경우 List가 아니라 Map으로 반환될 수 있음
            @SuppressWarnings("unchecked")
            Map<String, Object> itemMap = (Map<String, Object>) itemObj;
            String priceStr = String.valueOf(itemMap.get("price"));
            if (priceStr != null && !priceStr.isEmpty() && !"-".equals(priceStr)) {
                try {
                    return Integer.parseInt(priceStr.replace(",", ""));
                } catch (NumberFormatException e) {
                    log.warn("KAMIS 가격 파싱 오류: {}", priceStr);
                }
            }
        }
        return null;
    }
}
