package com.farmbalance.farm.adapter.in.event;

import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.FarmJpaRepository;
import com.farmbalance.user.domain.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * 유저 최종 탈퇴 시 해당 유저 농장 소프트 삭제 (도메인 간 느슨한 결합).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FarmSoftDeleteOnUserWithdrawnListener {

    private final FarmJpaRepository farmJpaRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        List<FarmJpaEntity> farms = farmJpaRepository.findAllActiveFarmsByUserId(event.userId());
        if (farms.isEmpty()) {
            return;
        }
        for (FarmJpaEntity farm : farms) {
            farm.softDelete();
        }
        farmJpaRepository.saveAll(farms);
        log.info("탈퇴 유저 농장 소프트 삭제: userId={}, farmCount={}", event.userId(), farms.size());
    }
}
