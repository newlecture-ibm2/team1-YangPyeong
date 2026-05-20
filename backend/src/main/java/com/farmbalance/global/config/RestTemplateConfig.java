package com.farmbalance.global.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * 전역 RestTemplate 설정.
 * <p>
 * Spring Boot 3.2+ 기본 JdkClientHttpRequestFactory(java.net.http.HttpClient)는
 * HTTP/2 upgrade 헤더를 전송하여 Uvicorn(AI 서버)이 "Unsupported upgrade request"
 * 경고와 함께 요청을 거부(422)하는 문제가 발생합니다.
 * <p>
 * SimpleClientHttpRequestFactory(HttpURLConnection 기반)를 명시적으로 지정하여
 * 순수 HTTP/1.1만 사용하도록 합니다.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(10));

        return builder
                .requestFactory(() -> factory)
                .build();
    }
}
