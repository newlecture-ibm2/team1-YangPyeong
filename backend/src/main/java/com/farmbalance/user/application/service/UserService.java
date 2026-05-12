package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.in.CheckNicknameUseCase;
import com.farmbalance.user.application.port.in.GetProfileUseCase;
import com.farmbalance.user.application.port.in.UpdateProfileCommand;
import com.farmbalance.user.application.port.in.UpdateProfileUseCase;
import com.farmbalance.user.application.port.out.SecurityQuestionRepository;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.config.UserAccountProperties;
import com.farmbalance.user.domain.User;
import com.farmbalance.user.domain.UserStatus;
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
     * 자진 탈퇴 요청 — 즉시 WITHDRAWN이 아니라 유예 기간(PENDING_WITHDRAWAL) 후 최종 처리됩니다.
     */
    @Override
    public void withdrawAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.PENDING_WITHDRAWAL) {
            throw new BusinessException(ErrorCode.USER_WITHDRAWAL_ALREADY_PENDING);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "탈퇴 요청할 수 없는 계정 상태입니다.");
        }

        user.requestWithdrawal();
        userRepository.save(user);
    }

    @Override
    public void cancelPendingWithdrawal(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (user.getStatus() != UserStatus.PENDING_WITHDRAWAL) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "탈퇴 유예 중인 계정만 취소할 수 있습니다.");
        }
        user.cancelPendingWithdrawal();
        userRepository.save(user);
    }

    @Override
    public void reactivateAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() != UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "탈퇴 완료된 계정만 재활성화할 수 있습니다.");
        }

        user.reactivate();
        userRepository.save(user);
    }

    /**
     * 스케줄러: 유예 만료 시 WITHDRAWN 확정 및 {@link UserWithdrawnEvent} 발행.
     */
    public void finalizeDueWithdrawals() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(userAccountProperties.getWithdrawalGraceDays());
        List<User> due = userRepository.findPendingWithdrawalsForFinalization(UserStatus.PENDING_WITHDRAWAL, deadline);
        for (User snapshot : due) {
            User user = userRepository.findById(snapshot.getId())
                    .orElse(null);
            if (user == null || user.getStatus() != UserStatus.PENDING_WITHDRAWAL) {
                continue;
            }
            user.completeFinalWithdrawal();
            userRepository.save(user);
            eventPublisher.publishEvent(new UserWithdrawnEvent(user.getId()));
            log.info("탈퇴 유예 만료 → 최종 탈퇴: userId={}", user.getId());
        }
    }

    /**
     * 스케줄러: 최종 탈퇴 후 일정 기간 경과 시 개인정보 비식별화.
     */
    public void anonymizeDueWithdrawnUsers() {
        LocalDateTime cutoff = LocalDateTime.now()
                .minusDays(userAccountProperties.getAnonymizationDaysAfterWithdrawal());
        List<User> targets = userRepository.findWithdrawnUsersForAnonymization(UserStatus.WITHDRAWN, cutoff);
        for (User snapshot : targets) {
            User user = userRepository.findById(snapshot.getId()).orElse(null);
            if (user == null
                    || user.getStatus() != UserStatus.WITHDRAWN
                    || user.getAnonymizedAt() != null) {
                continue;
            }
            user.anonymize();
            userRepository.save(user);
            log.info("탈퇴 계정 비식별화 완료: formerUserId={}", user.getId());
        }
    }
}
