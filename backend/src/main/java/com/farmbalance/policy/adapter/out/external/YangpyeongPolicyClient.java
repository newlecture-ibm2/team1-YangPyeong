package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.domain.PolicyNoticeFilter;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySource;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 양평군청 고시/공고 게시판 크롤러.
 * yp21.go.kr 내 농업/귀농/스마트팜 관련 공고를 수집합니다.
 *
 * <h3>크롤링 종료 조건 (recommendable 기준)</h3>
 * <ol>
 *   <li>추천 가능한 정책이 TARGET_RECOMMENDABLE_COUNT 이상이면 조기 종료</li>
 *   <li>연속 NO_RECOMMENDABLE_PAGE_LIMIT 페이지 동안 추천 가능 정책 0건이면 종료</li>
 *   <li>MAX_PAGES에 도달하면 종료</li>
 * </ol>
 */
@Slf4j
@Component
public class YangpyeongPolicyClient implements PolicyExternalFetchPort {

    // ── URL 상수 ──
    private static final String BASE_URL = "https://www.yp21.go.kr";

    /** 양평군청 고시/공고 게시판 (bbsNo=5, key=1119) */
    private static final String YANGPYEONG_NOTICE_URL =
            BASE_URL + "/www/selectBbsNttList.do?bbsNo=5&key=1119";

    // ── 크롤링 제어 상수 ──
    /** 추천 가능한 정책 목표 수집 건수 */
    private static final int TARGET_RECOMMENDABLE_COUNT = 15;
    /** 최대 탐색 페이지 수 */
    private static final int MAX_PAGES = 50;
    /** 연속 추천 가능 정책 0건 시 종료할 페이지 임계치 */
    private static final int NO_RECOMMENDABLE_PAGE_LIMIT = 10;

    // ── 농업 관련 키워드 필터 (확장) ──
    private static final List<String> FARM_KEYWORDS = List.of(
            "농업", "농가", "농업인", "귀농", "귀촌", "청년농", "후계농",
            "비료", "농기계", "스마트팜", "친환경", "축산", "재배", "작물",
            "농촌", "영농", "농산물", "농림", "원예", "농지", "종자",
            "유기농", "여성농", "로컬푸드", "판로", "농업기술",
            "한우", "양봉", "과수", "채소", "벼", "과일", "비닐하우스",
            "특용", "산림", "임업", "면세유", "가축", "방역", "농로", "배수로"
    );

    // ── 연결 설정 ──
    private static final int TIMEOUT_MS = 15_000; // 15초 (관공서 사이트 느린 응답 대비)
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    @Override
    public List<PolicyData> fetchPolicies() {
        List<PolicyData> allRecommendable = new ArrayList<>();
        int rawCollected = 0;
        int excludedNonBenefit = 0;
        int consecutiveEmptyPages = 0;
        int scannedPages = 0;

        try {
            for (int page = 1; page <= MAX_PAGES; page++) {
                scannedPages = page;
                String pageUrl = YANGPYEONG_NOTICE_URL + "&pageIndex=" + page;
                List<PolicyData> rawPolicies = fetchFromPage(pageUrl);

                // 페이지별 분류
                int pageRaw = rawPolicies.size();
                int pageExcluded = 0;
                int pageRecommendable = 0;

                for (PolicyData p : rawPolicies) {
                    rawCollected++;
                    if (PolicyNoticeFilter.isNonBenefitNotice(p.getTitle())) {
                        pageExcluded++;
                        excludedNonBenefit++;
                    } else {
                        allRecommendable.add(p);
                        pageRecommendable++;
                    }
                }

                log.info("[YangpyeongPolicyClient] page={}, rawAgriculture={}, excludedNotice={}, " +
                         "recommendable={}, totalRecommendable={}",
                         page, pageRaw, pageExcluded, pageRecommendable, allRecommendable.size());

                // 서버 부하 방지를 위한 짧은 딜레이
                Thread.sleep(500);

                // ── 종료 조건 1: 추천 가능 정책 목표 달성 ──
                if (allRecommendable.size() >= TARGET_RECOMMENDABLE_COUNT) {
                    log.info("[YangpyeongPolicyClient] 추천 가능 정책 {}건 도달 (목표 {}건). {}페이지에서 조기 종료.",
                            allRecommendable.size(), TARGET_RECOMMENDABLE_COUNT, page);
                    break;
                }

                // ── 종료 조건 2: 연속 추천 가능 정책 0건 ──
                if (pageRecommendable == 0) {
                    consecutiveEmptyPages++;
                    if (consecutiveEmptyPages >= NO_RECOMMENDABLE_PAGE_LIMIT) {
                        log.info("[YangpyeongPolicyClient] 연속 {}페이지 추천 가능 정책 0건. 탐색 종료.",
                                consecutiveEmptyPages);
                        break;
                    }
                } else {
                    consecutiveEmptyPages = 0;
                }
            }

            log.info("[YangpyeongPolicyClient] 양평군 크롤링 최종 결과: " +
                     "rawCollected={}, recommendableCollected={}, excludedNonBenefitNotice={}, scannedPages={}",
                     rawCollected, allRecommendable.size(), excludedNonBenefit, scannedPages);

            return allRecommendable;
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
        } catch (javax.net.ssl.SSLHandshakeException e) {
            log.warn("[YangpyeongPolicyClient] SSL handshake failed. " +
                     "Check server certificate chain or network policy. url={}", pageUrl);
            return Collections.emptyList();
        } catch (org.jsoup.HttpStatusException e) {
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
     *
     * <p>참고: 행정 공고(비혜택 문서) 판별은 {@code fetchPolicies()}에서 수행합니다.
     * 이 메서드에서는 농업 관련 여부만 체크합니다.</p>
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

        // 6. 고유 ID 생성 (pageIndex 제거한 URL + 제목 해시 — 같은 공고가 다른 페이지에 나타나도 중복 방지)
        String stableUrl = detailHref.replaceAll("[&?]pageIndex=\\d+", "");
        String externalId = "YP_" + Math.abs((title + stableUrl).hashCode());

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
