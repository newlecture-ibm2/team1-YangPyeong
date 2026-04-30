package com.farmbalance.policy.application.port.out;

import java.util.Optional;

/**
 * AI 서버에 정책 분석을 요청하는 Output Port.
 * adapter/out/external에서 구현합니다.
 */
public interface PolicyAiAnalyzePort {

    /**
     * 정책 데이터를 AI 서버로 전송하여 정규화 분석 결과를 받습니다.
     *
     * @param source      수집 소스 (GOV24, NONGSARO 등)
     * @param externalId  외부 정책 ID
     * @param rawJson     API 응답 JSON 원본 (nullable)
     * @param text        텍스트 원본 (nullable, 크롤링/PDF 등)
     * @param sourceUrl   원문 링크 URL (nullable)
     * @return AI 분석 결과 (JSON 문자열), 실패 시 Optional.empty()
     */
    Optional<AiAnalyzeResult> analyze(String source, String externalId,
                                       String rawJson, String text, String sourceUrl);

    /**
     * AI 분석 결과를 담는 record.
     */
    record AiAnalyzeResult(
            String title,
            String organization,
            String regionCode,
            String category,
            String target,
            String contentSummary,
            String supportAmount,
            String applyStart,
            String applyEnd,
            double confidence,
            java.util.List<String> warnings,
            /** result 전체를 JSON 문자열로 보관 (normalized_data 컬럼 저장용) */
            String normalizedJson
    ) {
    }
}
