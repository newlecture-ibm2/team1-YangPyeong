package com.farmbalance.balance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum YieldUnit {
    KG("kg", 1.0),
    TON("톤", 1000.0),
    GRAM("g", 0.001);

    private final String label;
    private final double factorToKg;

    public static YieldUnit fromLabel(String label) {
        return Arrays.stream(values())
                .filter(u -> u.label.equals(label))
                .findFirst()
                .orElse(KG); // 기본값 kg
    }

    public double toKg(double value) {
        return value * factorToKg;
    }
}
