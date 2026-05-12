package com.farmbalance.user.application.port.in;

/**
 * 프로필 수정 유스케이스
 */
public interface UpdateProfileUseCase {
    void updateProfile(UpdateProfileCommand command);
    void updateProfileImage(String email, String imageUrl);
    void changePassword(String email, String encodedPassword);
    void withdrawAccount(String email);
    void cancelPendingWithdrawal(String email);
    void reactivateAccount(String email);
}
