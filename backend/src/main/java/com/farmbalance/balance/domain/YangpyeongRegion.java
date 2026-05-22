package com.farmbalance.balance.domain;

import java.util.Arrays;

public enum YangpyeongRegion {
    YANGPYEONG("양평읍", 0.065),
    GANGSANG("강상면", 0.062),
    GANGHA("강하면", 0.035),
    YANGSEO("양서면", 0.060),
    OKCHEON("옥천면", 0.048),
    SEOJONG("서종면", 0.025),
    DANWOL("단월면", 0.065),
    CHEONGUN("청운면", 0.080),
    YANGDONG("양동면", 0.090),
    JIPYEONG("지평면", 0.185),
    YONGMUN("용문면", 0.145),
    GAEGUN("개군면", 0.140);

    private final String hangulName;
    private final double weight; // 가중치 비율 (총합 1.0)

    YangpyeongRegion(String hangulName, double weight) {
        this.hangulName = hangulName;
        this.weight = weight;
    }

    public String getHangulName() { return hangulName; }
    public double getWeight() { return weight; }

    // 한글 명칭으로 Enum을 찾는 편의 메서드
    public static YangpyeongRegion fromHangulName(String name) {
        return Arrays.stream(values())
                .filter(r -> r.getHangulName().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 양평군 행정구역입니다: " + name));
    }
}
