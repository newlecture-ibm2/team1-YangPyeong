package com.farmbalance.global.email;

/**
 * 이메일 발송 서비스 인터페이스.
 * 다른 도메인에서 이메일을 보낼 때 이 인터페이스를 의존합니다.
 */
public interface EmailService {

    /**
     * 이메일 발송
     *
     * @param to      수신자 이메일 주소
     * @param subject 제목
     * @param content HTML 본문
     */
    void send(String to, String subject, String content);
}
