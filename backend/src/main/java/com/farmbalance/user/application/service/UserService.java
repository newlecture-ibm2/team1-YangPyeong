package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.in.CheckNicknameUseCase;
import com.farmbalance.user.application.port.in.GetProfileUseCase;
import com.farmbalance.user.application.port.in.UpdateProfileCommand;
import com.farmbalance.user.application.port.in.UpdateProfileUseCase;
import com.farmbalance.user.application.port.out.CheckShopOrderPort;
import com.farmbalance.user.application.port.out.SecurityQuestionRepository;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.config.UserAccountProperties;
import com.farmbalance.user.domain.User;
import com.farmbalance.user.domain.UserStatus;
import com.farmbalance.user.domain.event.UserGracePeriodExpiredEvent;
import com.farmbalance.user.domain.event.UserReactivatedEvent;
import com.farmbalance.user.domain.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 사용자 정보 관리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UpdateProfileUseCase, CheckNicknameUseCase, GetProfileUseCase {

    private final UserRepository userRepository;
    private final SecurityQuestionRepository securityQuestionRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserAccountProperties userAccountProperties;
    private final CheckShopOrderPort checkShopOrderPort;

    @Override
    public void updateProfile(UpdateProfileCommand command) {
        User user = userRepository.findByEmail(command.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 닉네임이 변경된 경우에만 중복 검사 (DB name 미설정 null 대비)
        String previousName = user.getName() != null ? user.getName() : "";
        if (!previousName.equals(command.getName())) {
            if (userRepository.existsByName(command.getName())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "이미 사용 중인 이름입니다.");
            }
        }

        user.updateProfile(command.getName(), command.getPhone(), command.getAddress(), command.getBio());
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String name) {
        if (name == null || name.isBlank()) {
            return false;
        }
        return !userRepository.existsByName(name);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String name, String excludeEmail) {
        if (name == null || name.isBlank()) {
            return false;
        }
        if (excludeEmail == null || excludeEmail.isBlank()) {
            return !userRepository.existsByName(name);
        }
        return !userRepository.existsByNameAndEmailNot(name, excludeEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public User getProfileByUserId(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public void updateProfileImage(String email, String imageUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateProfileImageUrl(imageUrl);
        userRepository.save(user);
    }

    @Override
    public void changePassword(String email, String encodedPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changePassword(encodedPassword);
        userRepository.save(user);
    }

    /**
     * 자진 탈퇴 — 즉시 WITHDRAWN 처리 후 {@link UserWithdrawnEvent} 발행.
     * 타 도메인(상점 상품 Soft Delete 등)이 이벤트를 구독하여 당일 즉시 처리합니다.
     */
    @Override
    public void withdrawAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "이미 탈퇴 처리된 계정입니다.");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "탈퇴 요청할 수 없는 계정 상태입니다.");
        }

        user.requestWithdrawal();
        userRepository.save(user);

        // 타 도메인 즉시 처리 이벤트 발행 (상점 상품 Soft Delete 등)
        eventPublisher.publishEvent(new UserWithdrawnEvent(user.getId()));
        log.info("회원 즉시 탈퇴 완료 및 이벤트 발행: userId={}", user.getId());
    }

    /**
     * 탈퇴 계정 재활성화 (30일 이내만 가능).
     * 상점 상품 Soft Delete 해제 등은 별도 이벤트로 처리합니다.
     */
    @Override
    public void reactivateAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() != UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "탈퇴 완료된 계정만 재활성화할 수 있습니다.");
        }

        user.reactivate(userAccountProperties.getAnonymizationGraceDays());
        userRepository.save(user);

        // 상점 상품 등 복구 이벤트 발행
        eventPublisher.publishEvent(new UserReactivatedEvent(user.getId()));
        log.info("회원 탈퇴 복구(재활성화) 완료 및 이벤트 발행: userId={}", user.getId());
    }

    /**
     * 스케줄러: 탈퇴 후 30일(또는 5년) 경과 시 개인정보 비식별화.
     * <ul>
     *   <li>상점 거래 내역 없음 → 30일 뒤 비식별화 + {@link UserGracePeriodExpiredEvent} 발행</li>
     *   <li>상점 거래 내역 존재 → 5년 뒤 비식별화 + {@link UserGracePeriodExpiredEvent} 발행</li>
     * </ul>
     * 농장 Soft Delete, 장바구니/찜 Hard Delete는 {@link UserGracePeriodExpiredEvent} 리스너가 처리합니다.
     * 단, 농장과 장바구니 데이터의 삭제는 마스킹 시점과 무관하게 항상 30일 경과 시점에만 발생합니다.
     */
    public void anonymizeDueWithdrawnUsers() {
        LocalDateTime now = LocalDateTime.now();

        // 1) 30일 경과 대상: 상점 거래 내역 없는 유저 → 비식별화 + 농장/장바구니 정리 이벤트
        LocalDateTime graceCutoff = now.minusDays(userAccountProperties.getAnonymizationGraceDays());
        List<User> graceTargets = userRepository.findWithdrawnUsersForAnonymization(
                UserStatus.WITHDRAWN, graceCutoff);

        for (User snapshot : graceTargets) {
            User user = userRepository.findById(snapshot.getId()).orElse(null);
            if (user == null || user.getStatus() != UserStatus.WITHDRAWN
                    || user.getAnonymizedAt() != null) {
                continue;
            }

            boolean hasOrders = checkShopOrderPort.hasAnyOrderByUserId(user.getId());
            if (hasOrders) {
                // 전자상거래법 대상 → 30일 시점에서는 마스킹하지 않지만, 농장/장바구니 정리는 수행
                eventPublisher.publishEvent(new UserGracePeriodExpiredEvent(user.getId()));
                log.info("30일 경과 — 전자상거래 거래 내역 존재, 마스킹 보류 (5년 후 처리). 농장/장바구니 정리 이벤트 발행: userId={}", user.getId());
                // 마스킹 보류 표시: withdrawalRequestedAt을 그대로 두어 5년 뒤 배치에서 다시 조회되도록 함
                continue;
            }

            // 거래 내역 없는 유저 → 30일 경과 시 즉시 비식별화
            user.anonymize();
            userRepository.save(user);
            eventPublisher.publishEvent(new UserGracePeriodExpiredEvent(user.getId()));
            log.info("탈퇴 계정 비식별화 완료(30일 경과): formerUserId={}", user.getId());
        }

        // 2) 5년 경과 대상: 전자상거래법 보존 기간 만료 유저 → 비식별화
        LocalDateTime ecommerceCutoff = now.minusDays(userAccountProperties.getEcommerceRetentionDays());
        List<User> ecommerceTargets = userRepository.findWithdrawnUsersForAnonymization(
                UserStatus.WITHDRAWN, ecommerceCutoff);

        for (User snapshot : ecommerceTargets) {
            User user = userRepository.findById(snapshot.getId()).orElse(null);
            if (user == null || user.getStatus() != UserStatus.WITHDRAWN
                    || user.getAnonymizedAt() != null) {
                continue;
            }

            user.anonymize();
            userRepository.save(user);
            log.info("탈퇴 계정 비식별화 완료(5년 경과, 전자상거래법): formerUserId={}", user.getId());
        }
    }
}
