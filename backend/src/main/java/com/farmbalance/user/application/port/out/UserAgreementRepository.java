package com.farmbalance.user.application.port.out;

import com.farmbalance.user.domain.UserAgreement;

import java.util.List;

public interface UserAgreementRepository {
    void save(UserAgreement agreement);
    void saveAll(List<UserAgreement> agreements);
    List<UserAgreement> findAllByUserId(Long userId);
}
