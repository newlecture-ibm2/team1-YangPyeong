package com.farmbalance.chat.application.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 대화 내용 중 개인정보(전화번호, 주민번호 등)를 필터링하는 마스킹 유틸리티
 */
public class PiiMaskingUtils {
    // 전화번호 정규식 (010-1234-5678, 01012345678 등 대응)
    private static final Pattern PHONE_PATTERN = Pattern.compile("01[016789][- .]?\\d{3,4}[- .]?\\d{4}");
    
    // 주민등록번호 정규식 (900101-1234567 등 대응)
    private static final Pattern RRN_PATTERN = Pattern.compile("\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[- .]?[1-4]\\d{6}");

    // 이메일 정규식
    private static final Pattern EMAIL_PATTERN = Pattern.compile("([\\w.-]+)@([\\w.-]+\\.[a-zA-Z]{2,6})");

    // 신용카드 번호 정규식 (14~16자리)
    private static final Pattern CARD_PATTERN = Pattern.compile("\\d{4}[- .]?\\d{4}[- .]?\\d{4}[- .]?\\d{2,4}");

    public static String mask(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        
        String masked = input;
        
        // 1. 전화번호 마스킹 (010-****-****)
        Matcher phoneMatcher = PHONE_PATTERN.matcher(masked);
        masked = phoneMatcher.replaceAll("010-****-****");
        
        // 2. 주민번호 마스킹 (******-*******)
        Matcher rrnMatcher = RRN_PATTERN.matcher(masked);
        masked = rrnMatcher.replaceAll("******-*******");

        // 3. 이메일 마스킹 (앞 2글자만 노출: ab***@gmail.com)
        Matcher emailMatcher = EMAIL_PATTERN.matcher(masked);
        StringBuffer sb = new StringBuffer();
        while (emailMatcher.find()) {
            String id = emailMatcher.group(1);
            String domain = emailMatcher.group(2);
            String maskedId = id.length() > 2 ? id.substring(0, 2) + "***" : "***";
            emailMatcher.appendReplacement(sb, maskedId + "@" + domain);
        }
        emailMatcher.appendTail(sb);
        masked = sb.toString();

        // 4. 신용카드 마스킹 (****-****-****-****)
        Matcher cardMatcher = CARD_PATTERN.matcher(masked);
        masked = cardMatcher.replaceAll("****-****-****-****");
        
        return masked;
    }
}
