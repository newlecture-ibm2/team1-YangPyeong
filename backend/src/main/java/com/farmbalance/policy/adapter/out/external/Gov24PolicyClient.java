package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySource;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 정부24 보조금24 API v3 클라이언트.
 * 실제 공공서비스 혜택 정보를 수집합니다.
 *
 * API: https://api.odcloud.kr/api/gov24/v3/serviceList
 * 전체 목록에서 농업 관련 키워드가 포함된 정책만 필터링합니다.
 */
@Slf4j
@Component
public class Gov24PolicyClient implements PolicyExternalFetchPort {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    private static final String BASE_URL = "https://api.odcloud.kr/api/gov24/v3/serviceList";
    /** 농업 관련 키워드 — 서비스명/목적요약/소관기관에 포함되면 수집 */
    private static final List<String> FARM_KEYWORDS = List.of(
            "농업", "농촌", "영농", "귀농", "귀촌", "농가", "농기계",
            "축산", "임업", "농산물", "양잠", "양봉", "스마트팜",
            "농림", "원예", "농지", "토양", "비료", "종자"
    );
    /** 한 번에 가져올 페이지 크기 (최대 100) */
    private static final int PER_PAGE = 100;
    /** 최대 수집 페이지 수 */
    private static final int MAX_PAGES = 5;

    public Gov24PolicyClient(
            @Value("${gov24.api-key:}") String apiKey) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.apiKey = apiKey;
    }

    @Override
    public List<PolicyData> fetchPolicies() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[Gov24] API 키 미설정 → 건너뜁니다. (gov24.api-key 설정 필요)");
            return Collections.emptyList();
        }

        Set<String> seenIds = new HashSet<>();
        List<PolicyData> allPolicies = new ArrayList<>();

        for (int page = 1; page <= MAX_PAGES; page++) {
            try {
                List<PolicyData> pageResults = fetchPage(page, seenIds);
                allPolicies.addAll(pageResults);
                log.info("[Gov24] 페이지 {} → 농업 관련 {}건 (누적 {}건)",
                        page, pageResults.size(), allPolicies.size());
                // 모든 페이지를 탐색 (농업 데이터가 분산되어 있으므로 중단하지 않음)
            } catch (Exception e) {
                log.warn("[Gov24] 페이지 {} 수집 실패: {}", page, e.getMessage());
                break;
            }
        }

        log.info("[Gov24] 최종 수집 완료: 농업 관련 {}건", allPolicies.size());
        return allPolicies;
    }

    @Override
    public String getSourceName() {
        return PolicySource.GOV24.name();
    }

    private List<PolicyData> fetchPage(int page, Set<String> seenIds) throws Exception {
        String url = String.format("%s?page=%d&perPage=%d&returnType=JSON", BASE_URL, page, PER_PAGE);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Infuser " + apiKey);

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("HTTP " + response.getStatusCode());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode data = root.path("data");

        List<PolicyData> results = new ArrayList<>();
        if (data.isArray()) {
            for (JsonNode item : data) {
                // 농업 관련 키워드 필터
                if (!isFarmRelated(item)) continue;

                String serviceId = item.path("서비스ID").asText("");
                // 중복 방지
                if (seenIds.contains(serviceId)) continue;
                seenIds.add(serviceId);

                results.add(toPolicyData(item));
            }
        }
        return results;
    }

    /**
     * 서비스명, 서비스목적요약, 소관기관명, 지원내용에
     * 농업 관련 키워드가 포함되어 있는지 확인합니다.
     */
    private boolean isFarmRelated(JsonNode item) {
        String searchText = String.join(" ",
                item.path("서비스명").asText(""),
                item.path("서비스목적요약").asText(""),
                item.path("소관기관명").asText(""),
                item.path("지원내용").asText("").substring(0, Math.min(200, item.path("지원내용").asText("").length()))
        ).toLowerCase();

        return FARM_KEYWORDS.stream().anyMatch(searchText::contains);
    }

    /**
     * Gov24 API 응답 → PolicyData 변환.
     */
    private PolicyData toPolicyData(JsonNode item) {
        PolicyData p = new PolicyData();

        String serviceId = item.path("서비스ID").asText("");
        p.setExternalId("GOV24_" + serviceId);
        p.setSource(PolicySource.GOV24);
        p.setSourceUrl(item.path("상세조회URL").asText(null));

        // rawData: 원본 JSON 전체 보관
        try {
            p.setRawData(objectMapper.writeValueAsString(item));
        } catch (Exception e) {
            log.warn("[Gov24] rawData 직렬화 실패: {}", serviceId);
        }

        // content: AI 분석용 텍스트 조합
        StringBuilder sb = new StringBuilder();
        appendField(sb, "서비스명", item);
        appendField(sb, "서비스목적요약", item);
        appendField(sb, "지원대상", item);
        appendField(sb, "지원내용", item);
        appendField(sb, "선정기준", item);
        appendField(sb, "신청기한", item);
        appendField(sb, "신청방법", item);
        appendField(sb, "소관기관명", item);
        appendField(sb, "전화문의", item);
        p.setContent(sb.toString());

        return p;
    }

    private void appendField(StringBuilder sb, String fieldName, JsonNode item) {
        String value = item.path(fieldName).asText("");
        if (!value.isBlank()) {
            sb.append(fieldName).append(": ").append(value).append("\n");
        }
    }
}
