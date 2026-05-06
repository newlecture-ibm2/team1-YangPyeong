package com.farmbalance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FarmBalanceApplication {
    public static void main(String[] args) {
        SpringApplication.run(FarmBalanceApplication.class, args);
    }
}
