package com.farmbalance.user.adapter.out.persistence;

import com.farmbalance.user.adapter.out.persistence.entity.UserAgreementJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserAgreementJpaRepository;
import com.farmbalance.user.application.port.out.UserAgreementRepository;
import com.farmbalance.user.domain.UserAgreement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserAgreementPersistenceAdapter implements UserAgreementRepository {

    private final UserAgreementJpaRepository repository;

    @Override
    public void save(UserAgreement agreement) {
        repository.save(UserAgreementJpaEntity.fromDomain(agreement));
    }

    @Override
    public void saveAll(List<UserAgreement> agreements) {
        List<UserAgreementJpaEntity> entities = agreements.stream()
                .map(UserAgreementJpaEntity::fromDomain)
                .collect(Collectors.toList());
        repository.saveAll(entities);
    }

    @Override
    public List<UserAgreement> findAllByUserId(Long userId) {
        return repository.findAllByUserId(userId).stream()
                .map(UserAgreementJpaEntity::toDomain)
                .collect(Collectors.toList());
    }
}
