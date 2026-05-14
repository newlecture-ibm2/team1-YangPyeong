package com.farmbalance.farm.adapter.out.external.soil;

import com.farmbalance.farm.adapter.out.external.soil.dto.SoilV3Response;
import com.farmbalance.farm.adapter.out.external.soil.dto.SoilV2Response;
import com.farmbalance.farm.adapter.out.external.soil.dto.SoilBjdResponse;
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

    private static final String BASE_URL_V3 = "http://apis.data.go.kr/1390802/SoilEnviron/SoilCharac/V3/getSoilCharacter";
    private static final String BASE_URL_V2 = "http://apis.data.go.kr/1390802/SoilEnviron/SoilExam/V2/getSoilExam";
    private static final String BASE_URL_PH_STAT = "http://apis.data.go.kr/1390802/SoilEnviron/SoilExamStat/V2/getFarmExamPhInfo";
    private static final String BASE_URL_OM_STAT = "http://apis.data.go.kr/1390802/SoilEnviron/SoilExamStat/V2/getFarmExamOmInfo";

    private final RestClient restClient;
    private final XmlMapper xmlMapper;

    public SoilApiClient() {
        this.restClient = RestClient.builder().build();
        this.xmlMapper = new XmlMapper();
    }

    public SoilV3Response getSoilCharacteristics(String pnuCode) {
        URI uri = UriComponentsBuilder.fromHttpUrl(BASE_URL_V3).queryParam("serviceKey", apiKey).queryParam("PNU_CD", pnuCode).build(true).toUri();
        try {
            String xmlResponse = restClient.get().uri(uri).retrieve().body(String.class);
            return xmlMapper.readValue(xmlResponse, SoilV3Response.class);
        } catch (Exception e) {
            return createErrorResponseV3(e.getMessage());
        }
    }

    public SoilV2Response getSoilChemicalCharacteristics(String pnuCode) {
        URI uri = UriComponentsBuilder.fromHttpUrl(BASE_URL_V2).queryParam("serviceKey", apiKey).queryParam("PNU_CD", pnuCode).build(true).toUri();
        try {
            String xmlResponse = restClient.get().uri(uri).retrieve().body(String.class);
            return xmlMapper.readValue(xmlResponse, SoilV2Response.class);
        } catch (Exception e) {
            return createErrorResponseV2(e.getMessage());
        }
    }

    public SoilBjdResponse getSoilBjdStatistics(String bjdCode) {
        log.info("[SoilApiClient] 법정동 통계 가중 평균 계산 시작: {}", bjdCode);
        try {
            SoilBjdResponse phRes = fetchBjdStat(BASE_URL_PH_STAT, bjdCode);
            SoilBjdResponse omRes = fetchBjdStat(BASE_URL_OM_STAT, bjdCode);

            if (phRes.getBody() != null && phRes.getBody().getItems() != null && !phRes.getBody().getItems().isEmpty()) {
                SoilBjdResponse.BjdStatItem item = phRes.getBody().getItems().get(0);
                
                // 1. pH 가중 평균 계산
                double avgPh = calculatePhAverage(item);
                item.setAcidAvg(avgPh > 0 ? String.format("%.2f", avgPh) : null);

                // 2. 유기물 가중 평균 계산 (OM 데이터가 있는 경우)
                if (omRes.getBody() != null && omRes.getBody().getItems() != null && !omRes.getBody().getItems().isEmpty()) {
                    double avgOm = calculateOmAverage(omRes.getBody().getItems().get(0));
                    item.setOmAvg(avgOm > 0 ? String.format("%.2f", avgOm) : null);
                }
                return phRes;
            }
            return phRes;
        } catch (Exception e) {
            log.error("[SoilApiClient] BJD 통계 처리 중 오류: {}", e.getMessage());
            return createErrorResponseBjd(e.getMessage());
        }
    }

    private double calculatePhAverage(SoilBjdResponse.BjdStatItem item) {
        double[] midpoints = {4.25, 4.75, 5.25, 5.75, 6.25, 6.75};
        double totalArea = 0;
        double weightedSum = 0;

        // 논(Rfld)과 밭(Pfld) 면적 합산
        String[] phAreas = {
            add(item.getAcidRfld1(), item.getAcidPfld1()),
            add(item.getAcidRfld2(), item.getAcidPfld2()),
            add(item.getAcidRfld3(), item.getAcidPfld3()),
            add(item.getAcidRfld4(), item.getAcidPfld4()),
            add(item.getAcidRfld5(), item.getAcidPfld5()),
            add(item.getAcidRfld6(), item.getAcidPfld6())
        };

        for (int i = 0; i < 6; i++) {
            double area = parseDouble(phAreas[i]);
            weightedSum += (area * midpoints[i]);
            totalArea += area;
        }

        return totalArea > 0 ? weightedSum / totalArea : 0;
    }

    private double calculateOmAverage(SoilBjdResponse.BjdStatItem item) {
        double[] midpoints = {5.0, 15.0, 25.0, 35.0, 45.0, 55.0};
        double totalArea = 0;
        double weightedSum = 0;

        String[] omAreas = {
            add(item.getOmRfld1(), item.getOmPfld1()),
            add(item.getOmRfld2(), item.getOmPfld2()),
            add(item.getOmRfld3(), item.getOmPfld3()),
            add(item.getOmRfld4(), item.getOmPfld4()),
            add(item.getOmRfld5(), item.getOmPfld5()),
            add(item.getOmRfld6(), item.getOmPfld6())
        };

        for (int i = 0; i < 6; i++) {
            double area = parseDouble(omAreas[i]);
            weightedSum += (area * midpoints[i]);
            totalArea += area;
        }

        return totalArea > 0 ? weightedSum / totalArea : 0;
    }

    private String add(String s1, String s2) {
        return String.valueOf(parseDouble(s1) + parseDouble(s2));
    }

    private double parseDouble(String s) {
        try {
            return (s == null || s.isEmpty()) ? 0 : Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private SoilBjdResponse fetchBjdStat(String baseUrl, String bjdCode) throws Exception {
        URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl).queryParam("serviceKey", apiKey).queryParam("STDG_CD", bjdCode).build(true).toUri();
        String xmlResponse = restClient.get().uri(uri).retrieve().body(String.class);
        return xmlMapper.readValue(xmlResponse, SoilBjdResponse.class);
    }

    private SoilV3Response createErrorResponseV3(String message) {
        SoilV3Response errorRes = new SoilV3Response();
        SoilV3Response.Header header = new SoilV3Response.Header();
        header.setResultCode("E-ERROR");
        header.setResultMsg(message);
        errorRes.setHeader(header);
        return errorRes;
    }

    private SoilV2Response createErrorResponseV2(String message) {
        SoilV2Response errorRes = new SoilV2Response();
        SoilV2Response.Header header = new SoilV2Response.Header();
        header.setResultCode("E-ERROR");
        header.setResultMsg(message);
        errorRes.setHeader(header);
        return errorRes;
    }

    private SoilBjdResponse createErrorResponseBjd(String message) {
        SoilBjdResponse errorRes = new SoilBjdResponse();
        SoilBjdResponse.Header header = new SoilBjdResponse.Header();
        header.setResultCode("E-ERROR");
        header.setResultMsg(message);
        errorRes.setHeader(header);
        return errorRes;
    }
}
