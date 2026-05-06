package com.farmbalance.global.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * SMTP 기반 이메일 발송 구현체.
 * @Async로 비동기 처리하여 주문 API 응답 지연을 방지합니다.
 */
@Service
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    @Async
    public void send(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true); // HTML 형식
            helper.setFrom("noreply@farmbalance.com");

            mailSender.send(message);
            log.info("[이메일] 발송 성공 → {} (제목: {})", to, subject);
        } catch (MessagingException e) {
            log.error("[이메일] 발송 실패 → {} (제목: {}): {}", to, subject, e.getMessage());
        }
    }
}
