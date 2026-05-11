package com.farmbalance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@org.springframework.cache.annotation.EnableCaching
@org.springframework.scheduling.annotation.EnableAsync
public class FarmBalanceApplication {
    public static void main(String[] args) {
        SpringApplication.run(FarmBalanceApplication.class, args);
    }
}
