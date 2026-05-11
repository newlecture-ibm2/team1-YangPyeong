package com.farmbalance.admin.adapter.out.external.nongsaro;

import com.farmbalance.admin.adapter.out.external.nongsaro.dto.NongsaroApiResponse;
import com.farmbalance.admin.adapter.out.external.nongsaro.dto.WorkScheduleGrpDto;
import com.farmbalance.admin.adapter.out.external.nongsaro.dto.WorkScheduleLstDto;
import com.farmbalance.admin.application.port.out.AdminNongsaroApiPort;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminNongsaroApiAdapter implements AdminNongsaroApiPort {

    private final RestTemplate restTemplate;

    @Value("${app.api.nongsaro.default-key}")
    private String apiKey;

    private static final String BASE_URL = "http://api.nongsaro.go.kr/service/farmWorkingPlan";

    @Override
    public List<WorkScheduleGrpDto> getWorkScheduleGroupList() {
        String url = BASE_URL + "/workScheduleGrpList?apiKey=" + apiKey;
        ResponseEntity<NongsaroApiResponse<WorkScheduleGrpDto>> response = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {}
        );
        return extractItems(response.getBody());
    }

    @Override
    public List<WorkScheduleLstDto> getWorkScheduleList(String kidofcomdtySeCode) {
        String url = BASE_URL + "/workScheduleLst?apiKey=" + apiKey + "&kidofcomdtySeCode=" + kidofcomdtySeCode;
        ResponseEntity<NongsaroApiResponse<WorkScheduleLstDto>> response = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {}
        );
        return extractItems(response.getBody());
    }

    private <T> List<T> extractItems(NongsaroApiResponse<T> response) {
        if (response == null || response.getHeader() == null) {
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }
        if (!"00".equals(response.getHeader().getResultCode())) {
            log.error("농사로 API 에러: {}", response.getHeader().getResultMsg());
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }
        if (response.getBody() == null || response.getBody().getItems() == null || response.getBody().getItems().getItem() == null) {
            return Collections.emptyList();
        }
        return response.getBody().getItems().getItem();
    }
}
