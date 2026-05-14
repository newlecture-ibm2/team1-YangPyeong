package com.farmbalance.notification.application.service;

import com.farmbalance.notification.application.port.out.FcmTokenPort;
import com.farmbalance.notification.domain.FcmToken;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmNotificationService {

    private final FcmTokenPort fcmTokenPort;

    @Async
    public void sendToUser(Long userId, String title, String body, String link) {
        List<FcmToken> tokens = fcmTokenPort.findByUserId(userId);
        if (tokens.isEmpty()) {
            return;
        }

        for (FcmToken fcmToken : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(fcmToken.getToken())
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putData("link", link != null ? link : "/")
                        .build();

                String response = FirebaseMessaging.getInstance().send(message);
                log.info("[FCM] Sent message to user {}: {}", userId, response);
            } catch (FirebaseMessagingException e) {
                // 만료/등록해제된 토큰은 DB에서 자동 삭제
                if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED
                        || e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT) {
                    log.info("[FCM] 만료된 토큰 삭제 - userId: {}, token: {}...}", userId, fcmToken.getToken().substring(0, 20));
                    fcmTokenPort.deleteByUserIdAndToken(userId, fcmToken.getToken());
                } else {
                    log.warn("[FCM] 발송 실패 - userId: {}, error: {}", userId, e.getMessage());
                }
            } catch (Exception e) {
                log.warn("[FCM] 발송 실패 - userId: {}, error: {}", userId, e.getMessage());
            }
        }
    }
}
