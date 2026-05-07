package com.farmbalance.global.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis 및 Cache 설정
 */
@EnableCaching
@Configuration
public class RedisConfig {

    /**
     * DTO 안에 LocalDateTime 등 Java 8 날짜/시간 객체가 있을 때 발생하는 
     * 직렬화/역직렬화 에러를 방지하기 위한 커스텀 Serializer
     */
    private GenericJackson2JsonRedisSerializer customJsonSerializer() {
        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(customJsonSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(customJsonSerializer());
        return template;
    }

    /**
     * 팀원들이 @Cacheable을 사용할 수 있도록 도메인별 만료 시간(TTL)을 세팅한 CacheManager
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 1. 기본 캐시 설정 (직렬화 방식 및 기본 TTL: 10분)
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(customJsonSerializer()))
                .entryTtl(Duration.ofMinutes(10));

        // 2. 캐시 이름(Cache Name)별 커스텀 TTL 설정
        Map<String, RedisCacheConfiguration> customConfigs = new HashMap<>();
        
        // 기상(Weather): 3시간마다 갱신
        customConfigs.put("weatherCache", defaultConfig.entryTtl(Duration.ofHours(3)));
        
        // 토양(Soil): 24시간마다 갱신
        customConfigs.put("soilCache", defaultConfig.entryTtl(Duration.ofHours(24)));
        
        // AI 예측(AI): 1시간마다 갱신
        customConfigs.put("aiCache", defaultConfig.entryTtl(Duration.ofHours(1)));

        // 3. CacheManager 빌드 및 반환
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(customConfigs)
                .build();
    }
}
