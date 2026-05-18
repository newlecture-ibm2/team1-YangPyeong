package com.farmbalance.recommend.adapter.out.external;

import java.util.HashMap;
import java.util.Map;

public class KamisCropCodeMapper {

    // 작물명 -> KAMIS 품목코드(p_itemcode) 매핑
    private static final Map<String, String> CROP_CODE_MAP = new HashMap<>();

    static {
        // 식량작물 (미곡류, 맥류, 잡곡류, 두류, 서류)
        CROP_CODE_MAP.put("벼", "111");   // 쌀
        CROP_CODE_MAP.put("보리", "112"); // 겉보리
        CROP_CODE_MAP.put("밀", "114");   // 밀
        CROP_CODE_MAP.put("콩", "141");   // 흰콩
        CROP_CODE_MAP.put("팥", "142");   // 붉은팥
        CROP_CODE_MAP.put("녹두", "143"); // 녹두
        CROP_CODE_MAP.put("감자", "152"); // 감자
        CROP_CODE_MAP.put("고구마", "151");// 고구마
        
        // 채소류 (배추, 무, 양배추, 시금치, 상추, 수박, 참외, 오이, 호박, 토마토, 딸기, 당근)
        CROP_CODE_MAP.put("배추", "211");
        CROP_CODE_MAP.put("양배추", "212");
        CROP_CODE_MAP.put("시금치", "213");
        CROP_CODE_MAP.put("상추", "214");
        CROP_CODE_MAP.put("수박", "221");
        CROP_CODE_MAP.put("참외", "222");
        CROP_CODE_MAP.put("오이", "223");
        CROP_CODE_MAP.put("호박", "224");
        CROP_CODE_MAP.put("토마토", "225");
        CROP_CODE_MAP.put("딸기", "226");
        CROP_CODE_MAP.put("무", "231");
        CROP_CODE_MAP.put("당근", "232");
        
        // 양념채소 (건고추, 마늘, 양파, 파, 생강)
        CROP_CODE_MAP.put("고추", "241"); // 풋고추 또는 건고추 (여기선 건고추 코드 사용)
        CROP_CODE_MAP.put("마늘", "242");
        CROP_CODE_MAP.put("양파", "243");
        CROP_CODE_MAP.put("대파", "244"); // 파
        CROP_CODE_MAP.put("생강", "245");
        
        // 과일류 (사과, 배, 복숭아, 포도, 감귤, 단감)
        CROP_CODE_MAP.put("사과", "411");
        CROP_CODE_MAP.put("배", "412");
        CROP_CODE_MAP.put("복숭아", "413");
        CROP_CODE_MAP.put("포도", "414");
        CROP_CODE_MAP.put("감귤", "415");
        CROP_CODE_MAP.put("감", "416");   // 단감
        CROP_CODE_MAP.put("블루베리", "424"); // 임의 또는 근접
        
        // 특용/버섯
        CROP_CODE_MAP.put("참깨", "251");
        CROP_CODE_MAP.put("땅콩", "252");
        CROP_CODE_MAP.put("느타리", "611");
        CROP_CODE_MAP.put("표고버섯", "612"); // 표고
    }

    public static boolean hasDirectMapping(String cropName) {
        return cropName != null && CROP_CODE_MAP.containsKey(cropName.trim());
    }

    public static String getKamisCode(String cropName) {
        if (cropName == null || cropName.isBlank()) {
            return null;
        }
        String direct = CROP_CODE_MAP.get(cropName.trim());
        if (direct != null) {
            return direct;
        }
        String standard = KamisCropNameResolver.resolveStandardName(cropName);
        return standard != null ? CROP_CODE_MAP.get(standard) : null;
    }

    /**
     * KAMIS 매핑이 등록된 전체 작물명 목록을 반환합니다.
     * 배치 스케줄러에서 일괄 시세 조회 시 사용됩니다.
     */
    public static java.util.Set<String> getAllMappedCropNames() {
        return java.util.Collections.unmodifiableSet(CROP_CODE_MAP.keySet());
    }
}
