package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySource;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import javax.net.ssl.SSLHandshakeException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 양평군청 고시/공고 게시판 크롤러.
 * yp21.go.kr 내 농업/귀농/스마트팜 관련 공고를 수집합니다.
 *
 * 페이지 구조가 변경되거나 접근이 차단될 경우 빈 리스트를 반환하며,
 * 전체 sync 파이프라인은 계속 진행됩니다.
 */
@Slf4j
@Component
public class YangpyeongPolicyClient implements PolicyExternalFetchPort {

    // ── URL 상수 ──
    private static final String BASE_URL = "https://www.yp21.go.kr";

    /** 양평군청 고시/공고 게시판 (bbsNo=5, key=1119) */
    private static final String YANGPYEONG_NOTICE_URL =
            BASE_URL + "/www/selectBbsNttList.do?bbsNo=5&key=1119";

    // ── 농업 관련 키워드 필터 ──
    private static final List<String> FARM_KEYWORDS = List.of(
            "농업", "농가", "농업인", "귀농", "귀촌", "청년농", "후계농",
            "비료", "농기계", "스마트팜", "친환경", "축산", "재배", "작물",
            "농촌", "영농", "농산물", "농림", "원예", "농지", "종자",
            "유기농", "여성농", "로컬푸드", "판로", "농업기술"
    );

    // ── 연결 설정 ──
    private static final int TIMEOUT_MS = 15_000; // 15초 (관공서 사이트 느린 응답 대비)
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    @Override
    public List<PolicyData> fetchPolicies() {
        try {
            List<PolicyData> policies = fetchFromPage(YANGPYEONG_NOTICE_URL);
            log.info("[YangpyeongPolicyClient] 양평군 고시/공고 → 농업 관련 {}건 수집", policies.size());
            return policies;
        } catch (Exception e) {
            // 크롤러 실패가 전체 sync 파이프라인을 중단시키지 않도록 방어
            log.warn("[YangpyeongPolicyClient] 양평군 게시판 수집 실패. 빈 리스트 반환: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public String getSourceName() {
        return PolicySource.YANGPYEONG.name();
    }

    /**
     * 단일 게시판 페이지에서 공고 목록을 파싱합니다.
     * 접근 차단(403) 또는 SSL 에러 시 warn 로그 후 빈 리스트를 반환합니다.
     */
    private List<PolicyData> fetchFromPage(String pageUrl) {
        Document doc;
        try {
            doc = createConnection(pageUrl).get();
        } catch (SSLHandshakeException e) {
            log.warn("[YangpyeongPolicyClient] SSL handshake failed. " +
                     "Check server certificate chain or network policy. url={}", pageUrl);
            return Collections.emptyList();
        } catch (HttpStatusException e) {
            log.warn("[YangpyeongPolicyClient] 양평군 게시판 접근 실패: status={} url={}",
                     e.getStatusCode(), pageUrl);
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("[YangpyeongPolicyClient] 양평군 게시판 연결 실패: {} url={}",
                     e.getMessage(), pageUrl);
            return Collections.emptyList();
        }

        // 게시판 목록 행 셀렉터 (양평군청 게시판 구조에 맞춰 다단계 시도)
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
            log.info("[YangpyeongPolicyClient] 셀렉터 매칭 실패 — 페이지 구조 변경 가능성: {}", pageUrl);
            return Collections.emptyList();
        }

        List<PolicyData> results = new ArrayList<>();
        for (Element row : rows) {
            try {
                PolicyData policy = parseRow(row);
                if (policy != null) {
                    results.add(policy);
                }
            } catch (Exception e) {
                log.debug("[YangpyeongPolicyClient] selector parse failed. row skipped: {}", e.getMessage());
            }
        }
        return results;
    }

    /**
     * Jsoup 연결을 생성합니다.
     * 관공서 사이트의 보안 차단을 우회하기 위해 브라우저 유사 헤더를 추가합니다.
     */
    private Connection createConnection(String url) {
        return Jsoup.connect(url)
                .userAgent(USER_AGENT)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                .header("Referer", BASE_URL)
                .header("Connection", "keep-alive")
                .header("Cache-Control", "no-cache")
                .timeout(TIMEOUT_MS)
                .followRedirects(true);
    }

    /**
     * 게시판 한 행을 PolicyData로 변환합니다.
     * 농업 관련 키워드가 없으면 null을 반환합니다.
     * 셀렉터 실패 시 NPE 없이 null을 반환합니다.
     */
    private PolicyData parseRow(Element row) {
        // 1. 제목 추출 (null-safe)
        Element titleLink = row.selectFirst("td.subject a, td.title a, a.subject");
        if (titleLink == null) {
            titleLink = row.selectFirst("a");
        }
        if (titleLink == null) return null;

        String title = titleLink.text().trim();
        if (title.isBlank()) return null;

        // 2. 농업 관련 키워드 필터
        if (!isFarmRelated(title)) return null;

        // 3. 상세 URL 추출 (null-safe)
        String detailHref = titleLink.attr("abs:href");
        if (detailHref == null || detailHref.isBlank()) {
            String relativeHref = titleLink.attr("href");
            if (relativeHref != null && !relativeHref.isBlank()) {
                detailHref = BASE_URL + (relativeHref.startsWith("/") ? "" : "/") + relativeHref;
            } else {
                detailHref = YANGPYEONG_NOTICE_URL;
            }
        }

        // 4. 날짜 추출 시도 (null-safe)
        String dateText = "";
        Element dateEl = row.selectFirst("td.date, td.regdate, span.date, td:nth-child(5)");
        if (dateEl != null) {
            dateText = dateEl.text().trim();
        }

        // 5. 상세 페이지에서 본문 요약 시도 (실패해도 목록 제목만으로 저장)
        String contentSummary = fetchDetailContent(detailHref, title);

        // 6. 고유 ID 생성 (URL + 제목 해시 기반 — 중복 방지)
        String externalId = "YP_" + Math.abs((title + detailHref).hashCode());

        PolicyData p = new PolicyData();
        p.setExternalId(externalId);
        p.setSource(PolicySource.YANGPYEONG);
        p.setTitle(title);
        p.setOrganization("양평군");
        p.setSourceUrl(detailHref);
        // region_code는 correctRegionCode에서 regions 테이블 LIKE 매칭으로 설정됨
        // 여기서는 "양평" 키워드가 들어있으므로 자동으로 양평군 코드가 부여됨
        p.setContent(contentSummary);

        return p;
    }

    /**
     * 상세 페이지에서 본문 요약을 추출합니다.
     * 접근 실패 시 목록 제목 기반의 기본 요약을 반환합니다.
     */
    private String fetchDetailContent(String detailUrl, String title) {
        try {
            Document detailDoc = createConnection(detailUrl).get();

            // 양평군청 상세 페이지 본문 셀렉터 (다단계 시도)
            Element contentArea = detailDoc.selectFirst("div.view_cont, div.board_view_cont, div.bbs_content");
            if (contentArea == null) {
                contentArea = detailDoc.selectFirst("td.content, div.content");
            }

            if (contentArea != null) {
                String text = contentArea.text().trim();
                if (!text.isBlank()) {
                    return text.length() > 300 ? text.substring(0, 300) + "..." : text;
                }
            }
        } catch (Exception e) {
            log.debug("[YangpyeongPolicyClient] 상세 페이지 접근 실패. 목록 제목으로 대체: url={}", detailUrl);
        }

        // fallback: 제목 기반 기본 요약
        return String.format("양평군 공고: %s", title);
    }

    /**
     * 제목에 농업 관련 키워드가 포함되어 있는지 확인합니다.
     */
    private boolean isFarmRelated(String title) {
        String lower = title.toLowerCase();
        return FARM_KEYWORDS.stream().anyMatch(lower::contains);
    }
}
