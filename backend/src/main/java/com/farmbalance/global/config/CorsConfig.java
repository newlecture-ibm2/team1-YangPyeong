package com.farmbalance.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 설정 — CORS + 업로드 파일 정적 서빙
 *
 * <p>
 * 업로드된 파일을 {@code /uploads/**} URL로 접근할 수 있도록
 * 정적 리소스 핸들러를 등록합니다.
 * </p>
 *
 * <pre>
 * 예: /uploads/abc-123.jpg → {file.upload.dir}/abc-123.jpg
 * </pre>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir:uploads/}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:3001",
                        "http://localhost:3131",
                        "https://farm.newlecture.com")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * 업로드된 파일을 /uploads/** URL로 정적 서빙합니다.
     * file.upload.dir 설정값에 따라 실제 파일 경로가 결정됩니다.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 경로 끝에 / 보장
        String location = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
        // 상대 경로인 경우 file: 프로토콜 추가
        if (!location.startsWith("file:") && !location.startsWith("/")) {
            location = "file:./" + location;
        } else if (location.startsWith("/")) {
            location = "file:" + location;
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
