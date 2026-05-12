package com.farmbalance.global.error;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 에러 코드 정의.
 * 명명 규칙: E-[도메인]-[기능]-[번호]
 *
 * 새 에러 코드 추가 시 해당 도메인 섹션에 번호를 이어서 추가하세요.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ── 공통 ──
    INTERNAL_ERROR("E-COMMON-001", "서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR("E-COMMON-002", "입력값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("E-COMMON-003", "요청한 리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ACCESS_DENIED("E-COMMON-004", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
    FILE_UPLOAD_FAILED("E-COMMON-005", "파일 업로드에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    EXTERNAL_API_ERROR("E-COMMON-006", "외부 API 연동 중 오류가 발생했습니다.", HttpStatus.BAD_GATEWAY),


    // ── 인증 ──
    AUTH_INVALID_CREDENTIALS("E-AUTH-LOGIN-001", "이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),
    AUTH_ACCOUNT_SUSPENDED("E-AUTH-LOGIN-002", "정지된 계정입니다. 관리자에게 문의하세요.", HttpStatus.FORBIDDEN),
    AUTH_ACCOUNT_PENDING("E-AUTH-LOGIN-003", "승인 대기 중인 계정입니다.", HttpStatus.FORBIDDEN),
    AUTH_TOKEN_EXPIRED("E-AUTH-TOKEN-001", "토큰이 만료되었습니다.", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_INVALID("E-AUTH-TOKEN-002", "유효하지 않은 토큰입니다.", HttpStatus.UNAUTHORIZED),
    AUTH_LOGIN_LOCKED("E-AUTH-LOGIN-004", "로그인 5회 실패로 30분간 잠금되었습니다.", HttpStatus.TOO_MANY_REQUESTS),
    AUTH_REFRESH_TOKEN_INVALID("E-AUTH-TOKEN-003", "유효하지 않은 리프레시 토큰입니다.", HttpStatus.UNAUTHORIZED),
    AUTH_SOCIAL_LOGIN_FAILED("E-AUTH-SOCIAL-001", "소셜 로그인에 실패했습니다.", HttpStatus.UNAUTHORIZED),
    AUTH_SOCIAL_EMAIL_REQUIRED("E-AUTH-SOCIAL-002", "소셜 계정에 이메일 정보가 없습니다. 이메일 제공에 동의해주세요.", HttpStatus.BAD_REQUEST),
    SECURITY_QUESTION_NOT_FOUND("E-AUTH-SECURITY-001", "등록된 보안질문이 없습니다.", HttpStatus.NOT_FOUND),
    SECURITY_ANSWER_MISMATCH("E-AUTH-SECURITY-002", "보안질문 답변이 일치하지 않습니다.", HttpStatus.BAD_REQUEST),

    // ── 사용자 ──
    USER_NOT_FOUND("E-USER-001", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    USER_EMAIL_DUPLICATE("E-USER-002", "이미 등록된 이메일입니다.", HttpStatus.CONFLICT),
    USER_INVALID_ROLE("E-USER-003", "올바르지 않은 역할입니다.", HttpStatus.BAD_REQUEST),
    USER_WITHDRAWN("E-USER-004", "탈퇴한 계정입니다. 다시 가입하시겠습니까?", HttpStatus.FORBIDDEN),

    // ── 농장 ──
    FARM_NOT_FOUND("E-FARM-001", "농장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    FARM_ALREADY_EXISTS("E-FARM-002", "이미 등록된 농장이 있습니다.", HttpStatus.CONFLICT),
    FARM_APPROVAL_PENDING("E-FARM-003", "승인 대기 중인 농장 등록 신청이 있습니다.", HttpStatus.CONFLICT),
    FARM_AREA_EXCEEDED("E-FARM-004", "재배 면적이 농장 전체 면적을 초과합니다. 가용 면적을 확인해주세요.", HttpStatus.BAD_REQUEST),
    FARM_NOT_OPERATING("E-FARM-008", "현재 농장이 운영 상태가 아닙니다. 재배 등록이 불가능합니다.", HttpStatus.BAD_REQUEST),
    FARM_PNU_DUPLICATE("E-FARM-005", "이미 등록된 지번(PNU)입니다.", HttpStatus.CONFLICT),
    FARM_INVALID_ADDRESS("E-FARM-006", "주소를 좌표로 변환할 수 없습니다. 올바른 주소를 입력해주세요.", HttpStatus.BAD_REQUEST),
    FARM_EXTERNAL_API_FAILED("E-FARM-007", "외부 API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.", HttpStatus.SERVICE_UNAVAILABLE),

    // ── 종자/파종/수확 ──
    SEED_NOT_FOUND("E-SEED-001", "종자 등록 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    CROP_PLAN_NOT_FOUND("E-PLAN-001", "파종 계획을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    HARVEST_NOT_FOUND("E-HARVEST-001", "수확 실적을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ALREADY_HARVESTED("E-HARVEST-002", "이미 수확이 완료된 재배 건입니다.", HttpStatus.CONFLICT),
    INVALID_HARVEST_YIELD("E-HARVEST-003", "수확량이 올바르지 않거나 예상치를 과도하게 초과했습니다.", HttpStatus.BAD_REQUEST),

    // ── 작물 ──
    CROP_NOT_FOUND("E-CROP-001", "작물을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    CROP_INACTIVE("E-CROP-002", "비활성화된 작물입니다.", HttpStatus.BAD_REQUEST),

    // ── 수급 밸런스 ──
    BALANCE_NOT_FOUND("E-BALANCE-001", "수급 데이터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // ── 상점 ──
    PRODUCT_NOT_FOUND("E-SHOP-001", "상품을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    PRODUCT_OUT_OF_STOCK("E-SHOP-002", "재고가 부족합니다.", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND("E-SHOP-003", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ORDER_INVALID_STATUS("E-SHOP-004", "주문 상태를 변경할 수 없습니다.", HttpStatus.BAD_REQUEST),
    CART_ITEM_NOT_FOUND("E-SHOP-005", "장바구니 항목을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // ── 커뮤니티 ──
    POST_NOT_FOUND("E-COMMUNITY-001", "게시글을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    COMMENT_NOT_FOUND("E-COMMUNITY-002", "댓글을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    POST_NOT_AUTHOR("E-COMMUNITY-003", "게시글 작성자만 수정/삭제할 수 있습니다.", HttpStatus.FORBIDDEN),
    REPORT_DUPLICATE("E-COMMUNITY-004", "이미 신고한 게시글/댓글입니다.", HttpStatus.CONFLICT),
    REPORT_OWN_CONTENT("E-COMMUNITY-005", "자신의 게시글/댓글은 신고할 수 없습니다.", HttpStatus.BAD_REQUEST),

    // ── 가게 ──
    STORE_NOT_FOUND("E-STORE-001", "가게 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // ── 정책 ──
    POLICY_NOT_FOUND("E-POLICY-001", "정책 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    POLICY_MATCH_FAILED("E-POLICY-002", "정책 매칭에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    POLICY_SYNC_FAILED("E-POLICY-003", "정책 데이터 동기화에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),

    // ── 관리자 ──
    ADMIN_ACTION_FAILED("E-ADMIN-001", "관리자 작업에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    ADMIN_INVALID_ROLE("E-ADMIN-002", "허용되지 않은 역할입니다. (GENERAL, FARMER만 가능)", HttpStatus.BAD_REQUEST),
    ADMIN_INVALID_STATUS("E-ADMIN-003", "허용되지 않은 상태입니다. (ACTIVE, SUSPENDED만 가능)", HttpStatus.BAD_REQUEST),
    API_SYNC_NOT_FOUND("E-ADMIN-004", "API 동기화 상태 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // ── 알림 ──
    NOTIFICATION_NOT_FOUND("E-NOTI-001", "알림을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // ── 지자체 ──
    GOV_REPORT_FAILED("E-GOV-001", "보고서 생성에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    ;

    private final String code;
    private final String message;
    private final HttpStatus status;
}
