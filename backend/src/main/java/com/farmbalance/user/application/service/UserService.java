package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.in.CheckNicknameUseCase;
import com.farmbalance.user.application.port.in.GetProfileUseCase;
import com.farmbalance.user.application.port.in.UpdateProfileCommand;
import com.farmbalance.user.application.port.in.UpdateProfileUseCase;
import com.farmbalance.user.application.port.out.SecurityQuestionRepository;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 정보 관리 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UpdateProfileUseCase, CheckNicknameUseCase, GetProfileUseCase {

    private final UserRepository userRepository;
    private final SecurityQuestionRepository securityQuestionRepository;

    @Override
    public void updateProfile(UpdateProfileCommand command) {
        User user = userRepository.findByEmail(command.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 닉네임이 변경된 경우에만 중복 검사
        if (!user.getName().equals(command.getName())) {
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

    @Override
    public void withdrawAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.withdraw();
        userRepository.save(user);
    }

    @Override
    public void reactivateAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.reactivate();
        userRepository.save(user);
    }
}
