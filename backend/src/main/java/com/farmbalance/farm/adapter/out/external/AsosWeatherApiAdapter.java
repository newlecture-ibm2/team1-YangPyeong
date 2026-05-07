package com.farmbalance.farm.adapter.out.external;

import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.ShortTermForecast;
import com.farmbalance.farm.domain.WeatherData;
import com.farmbalance.global.error.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
public class AsosWeatherApiAdapter implements WeatherRecordPort {


    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${external.weather.api-key:}")
    private String serviceKey;

    @Value("${external.weather.base-url:}")
    private String asosBaseUrl;

    @Value("${external.weather.fcst-url:}")
    private String fcstBaseUrl;

    public AsosWeatherApiAdapter(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public WeatherData fetchAsosDailyWeather(int stnId, LocalDate targetDate) {
        String formattedDate = targetDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        try {
            // 💡 중요: build(true)를 사용하여 serviceKey 등의 이중 인코딩 방지
            URI uri = UriComponentsBuilder.fromHttpUrl(asosBaseUrl + "/getWthrDataList")

                    .queryParam("serviceKey", serviceKey)
                    .queryParam("pageNo", 1)
                    .queryParam("numOfRows", 10)
                    .queryParam("dataType", "JSON")
                    .queryParam("dataCd", "ASOS")
                    .queryParam("dateCd", "DAY")
                    .queryParam("startDt", formattedDate)
                    .queryParam("endDt", formattedDate)
                    .queryParam("stnIds", stnId)
                    .build(true)
                    .toUri();

            log.info("[WeatherAPI] ASOS 데이터 요청: stnId={}, date={}", stnId, formattedDate);
            
            if (serviceKey == null || serviceKey.trim().isEmpty()) {
                throw new ExternalApiException("기상청 API 키(WEATHER_API_KEY)가 설정되지 않았습니다.");
            }

            // 디버깅을 위해 마스킹된 URI 로그 출력
            String maskedUri = uri.toString().replace(serviceKey, "********");
            log.debug("[WeatherAPI] 요청 URI (masked): {}", maskedUri);

            String response = restTemplate.getForObject(uri, String.class);
            
            if (response == null) {
                throw new ExternalApiException("기상청 API로부터 응답이 없습니다.");
            }

            JsonNode root = objectMapper.readTree(response);
            
            // 공공데이터포털 에러 응답 체크 (XML 응답 또는 결과 코드 확인)
            if (response.trim().startsWith("<") || !"00".equals(root.path("response").path("header").path("resultCode").asText())) {
                log.error("기상청 API 오류 응답: {}", response);
                String msg = root.path("response").path("header").path("resultMsg").asText("Unknown Error");
                throw new ExternalApiException("기상청 API 호출 중 오류가 발생했습니다. (Code: " + root.path("response").path("header").path("resultCode").asText() + ", Message: " + msg + ")");
            }

            JsonNode itemNode = root.path("response").path("body").path("items").path("item").get(0);

            if (itemNode == null || itemNode.isMissingNode()) {
                log.warn("기상청 API 응답에서 날씨 데이터를 찾을 수 없습니다. (stnId={}, date={})", stnId, formattedDate);
                throw new ExternalApiException("응답 데이터가 비어 있습니다.");
            }

            double avgTa = itemNode.path("avgTa").asDouble(0.0);
            String sumRnStr = itemNode.path("sumRn").asText("");
            double sumRn = sumRnStr.isEmpty() ? 0.0 : Double.parseDouble(sumRnStr);

            return WeatherData.builder()
                    .avgTa(avgTa)
                    .sumRn(sumRn)
                    .build();

        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("기상청 API 통신 또는 파싱 실패", e);
            throw new ExternalApiException("날씨 정보를 가져오는 중 시스템 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public ShortTermForecast fetchShortTermForecast(int nx, int ny) {
        // ... (기존 단기예보 로직 유지하되 필요 시 업데이트)
        // 여기서는 사용자가 요청한 ASOS 로직에 집중하여 기존 코드를 적절히 유지합니다.
        LocalDateTime now = LocalDateTime.now();
        String[] baseTimes = {"0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"};
        String baseDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseTime = "0500";

        int currentHour = now.getHour();
        int currentMinute = now.getMinute();
        
        for (int i = baseTimes.length - 1; i >= 0; i--) {
            int bt = Integer.parseInt(baseTimes[i]);
            int bh = bt / 100;
            if (currentHour > bh || (currentHour == bh && currentMinute >= 15)) {
                baseTime = baseTimes[i];
                break;
            }
            if (i == 0) {
                baseDate = now.minusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                baseTime = "2300";
            }
        }

        try {
            if (fcstBaseUrl == null || fcstBaseUrl.trim().isEmpty()) {
                throw new ExternalApiException("기상청 단기예보 API 주소(WEATHER_FCST_URL)가 설정되지 않았습니다.");
            }

            URI uri = UriComponentsBuilder.fromHttpUrl(fcstBaseUrl + "/getVilageFcst")
                    .queryParam("serviceKey", serviceKey)
                    .queryParam("pageNo", 1)
                    .queryParam("numOfRows", 1000)
                    .queryParam("dataType", "JSON")
                    .queryParam("base_date", baseDate)
                    .queryParam("base_time", baseTime)
                    .queryParam("nx", nx)
                    .queryParam("ny", ny)
                    .build(true)
                    .toUri();

            String response = restTemplate.getForObject(uri, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            JsonNode items = root.path("response").path("body").path("items").path("item");
            if (items.isMissingNode() || !items.isArray()) {
                throw new ExternalApiException("단기예보 데이터를 찾을 수 없습니다.");
            }

            var builder = ShortTermForecast.builder();
            for (JsonNode item : items) {
                String category = item.path("category").asText();
                String fcstValue = item.path("fcstValue").asText();
                
                switch (category) {
                    case "TMP" -> builder.tmp(Double.parseDouble(fcstValue));
                    case "REH" -> builder.reh(Double.parseDouble(fcstValue));
                    case "PCP" -> builder.pcp(fcstValue);
                    case "PTY" -> builder.pty(Integer.parseInt(fcstValue));
                    case "SKY" -> builder.sky(Integer.parseInt(fcstValue));
                    case "WSD" -> builder.wsd(Double.parseDouble(fcstValue));
                }
            }

            return builder.build();

        } catch (Exception e) {
            log.error("단기예보 API 호출 실패", e);
            throw new ExternalApiException("단기예보 정보를 가져오는 중 오류 발생");
        }
    }
}


