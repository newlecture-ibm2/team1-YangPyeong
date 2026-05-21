package com.farmbalance.recommend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
public class RecommendAsyncConfig {

    @Bean(name = "recommendAiExecutor")
    Executor recommendAiExecutor() {
        return Executors.newFixedThreadPool(4, r -> {
            Thread t = new Thread(r, "recommend-ai");
            t.setDaemon(true);
            return t;
        });
    }
}
