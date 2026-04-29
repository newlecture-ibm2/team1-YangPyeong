package com.farmbalance.chat.application.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 대화 내용 중 개인정보(전화번호, 주민번호 등)를 필터링하는 마스킹 유틸리티
 */
public class PiiMaskingUtils {
    // 전화번호 정규식 (010-1234-5678, 01012345678 등 대응)
    private static final Pattern PHONE_PATTERN = Pattern.compile("010[- .]?\\d{4}[- .]?\\d{4}");
    
    // 주민등록번호 정규식 (900101-1234567 등 대응)
    private static final Pattern RRN_PATTERN = Pattern.compile("\\d{6}[- .]?[1-4]\\d{6}");

    public static String mask(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        
        String masked = input;
        
        // 전화번호 마스킹 (010-****-****)
        Matcher phoneMatcher = PHONE_PATTERN.matcher(masked);
        masked = phoneMatcher.replaceAll("010-****-****");
        
        // 주민번호 마스킹 (******-*******)
        Matcher rrnMatcher = RRN_PATTERN.matcher(masked);
        masked = rrnMatcher.replaceAll("******-*******");
        
        return masked;
    }
}
