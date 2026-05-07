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
 */
@Service
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * 비동기 발송 — 주문 알림 등 실패해도 API 응답에 영향 없는 경우.
     */
    @Override
    @Async
    public void send(String to, String subject, String content) {
        try {
            doSend(to, subject, content);
        } catch (Exception e) {
            log.error("[이메일] 비동기 발송 실패 → {} (제목: {}): {}", to, subject, e.getMessage());
        }
    }

    /**
     * 동기 발송 — 비밀번호 재설정 등 실패 시 예외를 호출자에게 전파.
     */
    @Override
    public void sendSync(String to, String subject, String content) {
        try {
            doSend(to, subject, content);
        } catch (MessagingException | org.springframework.mail.MailException e) {
            log.error("[이메일] 동기 발송 실패 → {} (제목: {}): {}", to, subject, e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.", e);
        }
    }

    /** 공통 발송 로직 */
    private void doSend(String to, String subject, String content) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, true);
        helper.setFrom("noreply@farmbalance.com");

        mailSender.send(message);
        log.info("[이메일] 발송 성공 → {} (제목: {})", to, subject);
    }
}
