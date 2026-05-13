package com.farmbalance.balance.application.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.balance")
public class BalanceProperties {

    private Thresholds thresholds = new Thresholds();
    private Region region = new Region();

    @Getter
    @Setter
    public static class Thresholds {
        private double excessWarn = 150.0;
        private double excessCaution = 120.0;
        private double shortCaution = 80.0;
        private double shortWarn = 50.0;
    }

    @Getter
    @Setter
    public static class Region {
        private String defaultCode = "YP";
    }
}
