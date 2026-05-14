package com.farmbalance.farm.adapter.out.external;

import com.farmbalance.farm.application.port.out.GetCoordinatesPort;
import com.farmbalance.farm.domain.Coordinates;
import com.farmbalance.farm.domain.exception.InvalidAddressException;
import com.farmbalance.farm.domain.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * 카카오 로컬 REST API (/v2/local/search/address)를 호출하여
 * 주소 → 위도/경도 변환을 수행하는 Driven Adapter.
 */
@Slf4j
@Component
public class KakaoAddressAdapter implements GetCoordinatesPort {

    private static final String KAKAO_ADDRESS_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/address";

    private final RestTemplate restTemplate;
    private final String kakaoRestApiKey;
    private final ManageApiSyncUseCase manageApiSyncUseCase;

    public KakaoAddressAdapter(
            @Value("${external.kakao.rest-api-key}") String kakaoRestApiKey,
            ManageApiSyncUseCase manageApiSyncUseCase
    ) {
        this.restTemplate = new RestTemplate();
        this.kakaoRestApiKey = kakaoRestApiKey;
        this.manageApiSyncUseCase = manageApiSyncUseCase;
    }

    @Override
    public Coordinates getCoordinates(String address) {
        // [우회 로직] KAKAO_LOCAL API가 활성화 상태인지 확인
        ApiSyncStatus status = manageApiSyncUseCase.getApiSyncStatusByName("KAKAO_LOCAL");
        if (!status.getIsActive()) {
            log.warn("[우회 처리] KAKAO_LOCAL API가 비활성화 상태입니다. address={}", address);
            throw new BusinessException(ErrorCode.API_TEMPORARILY_UNAVAILABLE);
        }

        log.debug("카카오 주소 검색 요청: address={}", address);

        // 1. 요청 URI 구성
        URI uri = UriComponentsBuilder
                .fromUriString(KAKAO_ADDRESS_SEARCH_URL)
                .queryParam("query", address)
                .queryParam("analyze_type", "similar")
                .build()
                .encode()
                .toUri();

        // 2. Authorization 헤더 세팅
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        // 3. API 호출
        ResponseEntity<Map> response;
        try {
            response = restTemplate.exchange(uri, HttpMethod.GET, requestEntity, Map.class);
        } catch (RestClientException e) {
            log.error("카카오 주소 검색 API 호출 실패: {}", e.getMessage());
            throw new ExternalApiException();
        }

        // 4. 응답 파싱
        if (response.getBody() == null) {
            log.warn("카카오 주소 검색 응답이 비어 있습니다. address={}", address);
            throw new InvalidAddressException();
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");

        if (documents == null || documents.isEmpty()) {
            log.warn("카카오 주소 검색 결과가 없습니다. address={}", address);
            throw new InvalidAddressException();
        }

        // 5. 첫 번째 결과에서 x(경도), y(위도) 추출
        Map<String, Object> firstResult = documents.get(0);
        Double longitude = Double.valueOf(firstResult.get("x").toString());
        Double latitude = Double.valueOf(firstResult.get("y").toString());

        log.info("주소 좌표 변환 성공: address={}, lat={}, lng={}", address, latitude, longitude);
        return new Coordinates(latitude, longitude);
    }
}
