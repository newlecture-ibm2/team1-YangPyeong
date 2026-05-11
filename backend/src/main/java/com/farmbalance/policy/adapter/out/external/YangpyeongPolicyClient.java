package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySource;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 양평군청 공고/알림 게시판 크롤러.
 * yp21.go.kr 내 농업/복지/귀농 관련 공고를 수집합니다.
 *
 * 페이지 구조가 변경될 경우 셀렉터 실패 시 빈 리스트를 반환하며,
 * 전체 sync 파이프라인은 계속 진행됩니다.
 */
@Slf4j
@Component
public class YangpyeongPolicyClient implements PolicyExternalFetchPort {

    /** 양평군청 공고/알림 게시판 URL (농업/복지/귀농 관련) */
    private static final String[] TARGET_URLS = {
            // 양평군청 고시/공고 (새 URL)
            "https://www.yp21.go.kr/www/selectBbsNttList.do?bbsNo=46&key=1391"
    };

    /** 농업 관련 키워드 — 공고 제목에 포함되면 수집 대상 */
    private static final List<String> FARM_KEYWORDS = List.of(
            "농업", "농촌", "영농", "귀농", "귀촌", "농가", "농기계",
            "축산", "농산물", "스마트팜", "농림", "원예", "농지",
            "비료", "종자", "친환경", "유기농", "청년농", "여성농",
            "로컬푸드", "판로", "농업기술", "작물", "재배"
    );

    private static final int TIMEOUT_MS = 10_000;
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    @Override
    public List<PolicyData> fetchPolicies() {
        List<PolicyData> allPolicies = new ArrayList<>();

        for (String url : TARGET_URLS) {
            try {
                List<PolicyData> pagePolicies = fetchFromPage(url);
                allPolicies.addAll(pagePolicies);
                log.info("[양평군] {} → 농업 관련 {}건 수집", url, pagePolicies.size());
            } catch (Exception e) {
                log.warn("[양평군] 페이지 수집 실패 — {}: {}", url, e.getMessage());
                // 셀렉터 실패 등 → 빈 리스트 반환, 전체 sync 계속 진행
            }
        }

        log.info("[양평군] 최종 수집 완료: {}건", allPolicies.size());
        return allPolicies;
    }

    @Override
    public String getSourceName() {
        return PolicySource.YANGPYEONG.name();
    }

    /**
     * 단일 게시판 페이지에서 공고 목록을 파싱합니다.
     * 셀렉터가 매칭되지 않으면 빈 리스트를 반환합니다.
     */
    private List<PolicyData> fetchFromPage(String pageUrl) throws Exception {
        Document doc = Jsoup.connect(pageUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        // 양평군청 게시판의 일반적인 목록 구조: <table> 내 <tr> 반복
        Elements rows = doc.select("table.p-table tbody tr");
        if (rows.isEmpty()) {
            rows = doc.select("table.boardList tbody tr");
        }
        if (rows.isEmpty()) {
            rows = doc.select("div.board_list table tbody tr");
        }
        if (rows.isEmpty()) {
            rows = doc.select("ul.board_list li");
        }
        if (rows.isEmpty()) {
            log.info("[양평군] 셀렉터 매칭 실패 — 페이지 구조 변경 가능성: {}", pageUrl);
            return Collections.emptyList();
        }

        List<PolicyData> results = new ArrayList<>();
        for (Element row : rows) {
            try {
                PolicyData policy = parseRow(row, pageUrl);
                if (policy != null) {
                    results.add(policy);
                }
            } catch (Exception e) {
                log.debug("[양평군] 개별 행 파싱 스킵: {}", e.getMessage());
            }
        }
        return results;
    }

    /**
     * 게시판 한 행을 PolicyData로 변환합니다.
     * 농업 관련 키워드가 없으면 null을 반환합니다.
     */
    private PolicyData parseRow(Element row, String sourcePageUrl) {
        // 제목 추출
        Element titleLink = row.selectFirst("td.subject a, td.title a, a.subject");
        if (titleLink == null) {
            titleLink = row.selectFirst("a");
        }
        if (titleLink == null) return null;

        String title = titleLink.text().trim();
        if (title.isBlank()) return null;

        // 농업 관련 키워드 필터
        if (!isFarmRelated(title)) return null;

        // 상세 URL 추출
        String detailHref = titleLink.attr("abs:href");
        if (detailHref.isBlank()) {
            detailHref = sourcePageUrl;
        }

        // 날짜 추출 시도
        String dateText = "";
        Element dateEl = row.selectFirst("td.date, td.regdate, span.date");
        if (dateEl != null) {
            dateText = dateEl.text().trim();
        }

        // 기관명 추출 시도
        String orgText = "양평군";
        if (sourcePageUrl.contains("atec")) {
            orgText = "양평군 농업기술센터";
        }

        // 고유 ID 생성 (URL + 제목 해시 기반 — 중복 방지)
        String externalId = "YP_" + Math.abs((title + detailHref).hashCode());

        PolicyData p = new PolicyData();
        p.setExternalId(externalId);
        p.setSource(PolicySource.YANGPYEONG);
        p.setTitle(title);
        p.setOrganization(orgText);
        p.setSourceUrl(detailHref);
        // region_code는 correctRegionCode에서 regions 테이블 LIKE 매칭으로 설정됨
        // 여기서는 "양평" 키워드가 들어있으므로 자동으로 양평군 코드가 부여됨
        p.setContent(String.format("양평군 공고: %s (작성일: %s, 기관: %s)", title, dateText, orgText));

        return p;
    }

    /**
     * 제목에 농업 관련 키워드가 포함되어 있는지 확인합니다.
     */
    private boolean isFarmRelated(String title) {
        String lower = title.toLowerCase();
        return FARM_KEYWORDS.stream().anyMatch(lower::contains);
    }
}
