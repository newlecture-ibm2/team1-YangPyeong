package com.farmbalance.farm.adapter.out.external.soil;

import com.farmbalance.farm.adapter.out.external.soil.dto.SoilV3Response;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * 흙토람 토양정보 외부 API 클라이언트
 */
@Slf4j
@Component
public class SoilApiClient {

    @Value("${external.soil.api-key}")
    private String apiKey;

    // 검증된 V3 엔드포인트
    private static final String BASE_URL = "http://apis.data.go.kr/1390802/SoilEnviron/SoilCharac/V3/getSoilCharacter";

    private final RestClient restClient;
    private final XmlMapper xmlMapper;

    public SoilApiClient() {
        this.restClient = RestClient.builder().build();
        this.xmlMapper = new XmlMapper();
    }

    /**
     * PNU 코드를 기반으로 토양 물리성 상세 정보를 조회합니다.
     */
    public SoilV3Response getSoilCharacteristics(String pnuCode) {
        // 검증된 파라미터 규격 적용 (PNU_CD)
        URI uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .queryParam("serviceKey", apiKey)
                .queryParam("PNU_CD", pnuCode)
                .build(true)
                .toUri();

        log.info("[SoilApiClient] 토양 API 호출: {}", pnuCode);

        try {
            String xmlResponse = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            log.debug("[SoilApiClient] XML Response: {}", xmlResponse);

            // XML 데이터를 DTO로 변환
            SoilV3Response response = xmlMapper.readValue(xmlResponse, SoilV3Response.class);

            if (response.getHeader() != null && !"200".equals(response.getHeader().getResultCode())) {
                log.warn("[SoilApiClient] API 응답 에러: {}", response.getHeader().getResultMsg());
            }

            return response;

        } catch (Exception e) {
            log.error("[SoilApiClient] 처리 중 예외 발생: {}", e.getMessage());
            return createErrorResponse(e.getMessage());
        }
    }

    private SoilV3Response createErrorResponse(String message) {
        SoilV3Response errorRes = new SoilV3Response();
        SoilV3Response.Header header = new SoilV3Response.Header();
        header.setResultCode("E-ERROR");
        header.setResultMsg(message);
        errorRes.setHeader(header);
        return errorRes;
    }
}
