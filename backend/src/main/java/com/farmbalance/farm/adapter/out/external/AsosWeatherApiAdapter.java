package com.farmbalance.farm.adapter.out.external;

import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.WeatherInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

@Slf4j
@Component
public class AsosWeatherApiAdapter implements WeatherRecordPort {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${weather.api.service-key:}")
    private String serviceKey;

    private static final String BASE_URL = "http://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList";

    public AsosWeatherApiAdapter(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public WeatherInfo fetchAsosDailyWeather(int stnId, LocalDate targetDate) {
        String formattedDate = targetDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                    .queryParam("serviceKey", serviceKey)
                    .queryParam("pageNo", 1)
                    .queryParam("numOfRows", 10)
                    .queryParam("dataType", "JSON")
                    .queryParam("dataCd", "ASOS")
                    .queryParam("dateCd", "DAY")
                    .queryParam("startDt", formattedDate)
                    .queryParam("endDt", formattedDate)
                    .queryParam("stnIds", stnId)
                    .build(true) // true: serviceKey 등이 이미 인코딩되어 있다고 가정
                    .toUri();

            String response = restTemplate.getForObject(uri, String.class);
            
            JsonNode root = objectMapper.readTree(response);
            JsonNode itemNode = root.path("response").path("body").path("items").path("item").get(0);

            if (itemNode == null || itemNode.isMissingNode()) {
                log.warn("기상청 API 응답에서 날씨 데이터를 찾을 수 없습니다. (stnId={}, date={})", stnId, formattedDate);
                throw new IllegalStateException("API 응답에 item 데이터가 없습니다.");
            }

            double avgTa = itemNode.path("avgTa").asDouble(0.0);
            String sumRnStr = itemNode.path("sumRn").asText("");
            double sumRn = sumRnStr.isEmpty() ? 0.0 : Double.parseDouble(sumRnStr);

            return WeatherInfo.builder()
                    .avgTa(avgTa)
                    .sumRn(sumRn)
                    .build();

        } catch (Exception e) {
            log.error("기상청 API 통신 또는 파싱 실패 (stnId={}, date={})", stnId, formattedDate, e);
            throw new RuntimeException("날씨 정보를 가져오는 중 에러 발생", e);
        }
    }
}
