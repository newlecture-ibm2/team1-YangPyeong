package com.farmbalance.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials-base64:}")
    private String credentialsBase64;

    @PostConstruct
    public void init() {
        try {
            if (credentialsBase64 == null || credentialsBase64.isBlank()) {
                log.warn("[FirebaseConfig] FIREBASE_CREDENTIALS_BASE64 is not set. Skipping Firebase initialization.");
                return;
            }

            byte[] decoded = Base64.getDecoder().decode(credentialsBase64);
            InputStream serviceAccount = new ByteArrayInputStream(decoded);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("[FirebaseConfig] Firebase application has been initialized.");
            }
        } catch (Exception e) {
            log.warn("[FirebaseConfig] Failed to initialize Firebase app: {}", e.getMessage());
        }
    }
}
