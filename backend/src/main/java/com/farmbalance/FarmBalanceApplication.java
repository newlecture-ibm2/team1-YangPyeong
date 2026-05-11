package com.farmbalance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.farmbalance.recommend.adapter.out.external.KamisPriceAdapter;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableScheduling
public class FarmBalanceApplication {
    public static void main(String[] args) {
        SpringApplication.run(FarmBalanceApplication.class, args);
    }
}
