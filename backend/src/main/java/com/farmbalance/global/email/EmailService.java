package com.farmbalance.global.email;

/**
 * 이메일 발송 서비스 인터페이스.
 * 다른 도메인에서 이메일을 보낼 때 이 인터페이스를 의존합니다.
 */
public interface EmailService {

    /**
     * 이메일 비동기 발송 (주문 알림 등 실패해도 API 응답에 영향 없는 경우)
     *
     * @param to      수신자 이메일 주소
     * @param subject 제목
     * @param content HTML 본문
     */
    void send(String to, String subject, String content);

    /**
     * 이메일 동기 발송 (비밀번호 재설정 등 실패 시 에러를 호출자에게 전파해야 하는 경우)
     *
     * @param to      수신자 이메일 주소
     * @param subject 제목
     * @param content HTML 본문
     * @throws RuntimeException 발송 실패 시
     */
    void sendSync(String to, String subject, String content);
}
