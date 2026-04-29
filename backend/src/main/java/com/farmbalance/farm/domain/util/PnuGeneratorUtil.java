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
        
        // 본번과 부번을 4자리 0 패딩
        String paddedMainNo = String.format("%04d", Integer.parseInt(mainNo));
        String paddedSubNo = String.format("%04d", Integer.parseInt(subNo));

        return bjdCode + landType + paddedMainNo + paddedSubNo;
    }
}
