package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 통합 테스트용 Mock 정책 Fetcher.
 *
 * 활성화 조건: app.policy.mock-fetcher-enabled=true (기본값: true)
 * 실제 API Fetcher와 공존 가능합니다.
 *
 * 포함된 테스트 케이스:
 * 1. 정상 보조금 정책 (GOV24 스타일)
 * 2. region_code "4100" 보정 필요
 * 3. 양평군 이름 기반 매칭
 * 4. 잘못된 카테고리 + 날짜 파싱 어려운 값
 * 5. AI 분석 시 낮은 confidence 유도
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.policy.mock-fetcher-enabled", havingValue = "true", matchIfMissing = false)
public class MockPolicyFetcher implements PolicyExternalFetchPort {

    @Override
    public List<PolicyData> fetchPolicies() {
        log.info("[MockFetcher] 테스트 정책 7건 생성 (1건 AI skip 유도)");
        return List.of(
                buildPolicy1(),
                buildPolicy2(),
                buildPolicy3(),
                buildPolicy4(),
                buildPolicy5(),
                buildPolicy6(),
                buildPolicy7()
        );
    }

    @Override
    public String getSourceName() {
        return PolicySource.SEED.name();
    }

    // ── 1. 정상 보조금 정책 (GOV24 스타일) ──
    private PolicyData buildPolicy1() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_001");
        p.setSource(PolicySource.SEED);
        p.setRawData("{\"servNm\":\"청년농업인 영농정착 지원사업\",\"servDgst\":\"만 18~40세 이하 청년농에게 월 최대 100만원 영농정착금 지원\",\"jurMnofNm\":\"농림축산식품부\",\"applyBgngYmd\":\"2025-03-01\",\"applyEndYmd\":\"2025-04-30\"}");
        p.setSourceUrl("https://gov24.go.kr/policy/mock001");
        return p;
    }

    // ── 2. region_code "4100" 보정 필요 ──
    private PolicyData buildPolicy2() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_002");
        p.setSource(PolicySource.SEED);
        p.setContent("경기도 농기계 임대 사업. 트랙터 60마력 일 3만원, 최대 7일. 문의: 031-770-1234");
        p.setSourceUrl("https://nongsaro.go.kr/machine/mock002");
        return p;
    }

    // ── 3. 양평군 이름 기반 region_code 매칭 ──
    private PolicyData buildPolicy3() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_003");
        p.setSource(PolicySource.SEED);
        p.setContent("양평군 농업기술센터 무료 토양 검정 서비스. 농경지 토양의 산도, 유기물, 인산 등을 무료로 검정. 신청기간: 2025년 3월~11월 상시접수. 대상: 양평군 소재 농업인.");
        p.setSourceUrl("https://soil.rda.go.kr/mock003");
        return p;
    }

    // ── 4. 잘못된 카테고리 + 파싱 어려운 날짜 ──
    private PolicyData buildPolicy4() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_004");
        p.setSource(PolicySource.SEED);
        p.setContent("스마트팜 기초 교육과정 모집\n주관: 한국농업교육포털\n교육기간: 2025.5.12 ~ 2025.5.16\n수강료: 무료\n모집: 100명\n신청마감: ~4월 30일");
        p.setSourceUrl("https://agriedu.net/mock004");
        return p;
    }

    // ── 5. 최소 데이터 (낮은 confidence 유도) ──
    private PolicyData buildPolicy5() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_005");
        p.setSource(PolicySource.SEED);
        p.setContent("농업 관련 지원 프로그램 안내. 자세한 사항은 해당 기관에 문의.");
        return p;
    }

    // ── 6. AI 분석 실패 유도 (의미 없는 텍스트) ──
    private PolicyData buildPolicy6() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_006");
        p.setSource(PolicySource.SEED);
        p.setContent("ㅁㄴㅇㄹ asdf 1234 !@#$ 테스트 데이터 무의미한 문자열");
        return p;
    }

    // ── 7. AI 호출 강제 skip 케이스 (analyzed < fetched 검증용) ──
    private PolicyData buildPolicy7() {
        PolicyData p = new PolicyData();
        p.setExternalId("MOCK_SKIP_007");
        p.setSource(PolicySource.SEED);
        p.setContent("이 정책은 AI 분석 실패를 시뮬레이션합니다. MOCK_SKIP_ prefix로 강제 skip 처리됩니다.");
        return p;
    }
}
