package com.farmbalance.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * 파이썬 AI 서버 연동을 위한 공통 RestClient 설정.
 * 챗봇(Agent)과 AI 분석 기능이 단일 AI 서버(ai-server)에 통합되었습니다.
 */
@Configuration
public class AiClientConfig {

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;

    /**
     * 머신러닝 AI 모델 전용 RestClient (30초 대기)
     */
    @Bean
    public RestClient aiRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5초
        factory.setReadTimeout(30000);   // AI 추론은 오래 걸리므로 30초 대기

        return RestClient.builder()
                .baseUrl(aiServerUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * LLM 프롬프트 챗봇 전용 RestClient (60초 대기).
     * 챗봇도 ai-server 내부의 /api/chat 엔드포인트를 호출합니다.
     */
    @Bean
    public RestClient agentRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(60000);   // LLM Agent 응답은 매우 오래 걸릴 수 있으므로 60초 대기

        return RestClient.builder()
                .baseUrl(aiServerUrl)
                .requestFactory(factory)
                .build();
    }
}
