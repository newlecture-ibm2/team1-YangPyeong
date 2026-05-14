package com.farmbalance.farm.adapter.in.event;

import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.FarmJpaRepository;
import com.farmbalance.user.domain.event.UserGracePeriodExpiredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * 유저 탈퇴 30일 유예기간 만료 시 해당 유저 농장 소프트 삭제 (도메인 간 느슨한 결합).
 * 유예기간(30일) 동안에는 농장 데이터가 유지되어 AI 수급 통계의 안정성을 보장합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FarmSoftDeleteOnUserWithdrawnListener {

    private final FarmJpaRepository farmJpaRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserGracePeriodExpired(UserGracePeriodExpiredEvent event) {
        List<FarmJpaEntity> farms = farmJpaRepository.findAllActiveFarmsByUserId(event.userId());
        if (farms.isEmpty()) {
            return;
        }
        for (FarmJpaEntity farm : farms) {
            farm.softDelete();
        }
        farmJpaRepository.saveAll(farms);
        log.info("탈퇴 유예 만료 → 농장 소프트 삭제: userId={}, farmCount={}", event.userId(), farms.size());
    }
}
