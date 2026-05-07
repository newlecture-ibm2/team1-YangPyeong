package com.farmbalance.farm.domain.util;

public class PnuGeneratorUtil {

    private PnuGeneratorUtil() {
        // 인스턴스화 방지
    }

    /**
     * PNU 코드 생성
     * @param bjdCode 10자리 법정동 코드
     * @param isMountain 산 여부 (true면 임야 '2', false면 일반 '1')
     * @param mainNo 본번
     * @param subNo 부번
     * @return 19자리 PNU 코드
     */
    public static String generate(String bjdCode, boolean isMountain, String mainNo, String subNo) {
        if (bjdCode == null || bjdCode.length() != 10) {
            throw new IllegalArgumentException("법정동 코드는 10자리여야 합니다.");
        }

        String landType = isMountain ? "2" : "1";
        
        // 본번과 부번을 숫자로 변환 (비어있거나 형식이 잘못된 경우 0으로 처리)
        int mainNum = 0;
        int subNum = 0;
        try {
            if (mainNo != null && !mainNo.trim().isEmpty()) {
                mainNum = Integer.parseInt(mainNo.replaceAll("[^0-9]", ""));
            }
            if (subNo != null && !subNo.trim().isEmpty()) {
                subNum = Integer.parseInt(subNo.replaceAll("[^0-9]", ""));
            }
        } catch (NumberFormatException e) {
            // 숫자 변환 실패 시 0 유지
        }

        String paddedMainNo = String.format("%04d", mainNum);
        String paddedSubNo = String.format("%04d", subNum);

        return bjdCode + landType + paddedMainNo + paddedSubNo;
    }
}
