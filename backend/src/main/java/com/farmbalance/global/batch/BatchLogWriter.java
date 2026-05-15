package com.farmbalance.global.batch;

import com.farmbalance.policy.adapter.out.persistence.entity.BatchLogJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.BatchLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 배치 로그 저장을 전담하는 서비스.
 * REQUIRES_NEW 트랜잭션 전파 속성을 보장하기 위해 분리된 빈(Bean)입니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchLogWriter {

    private final BatchLogRepository batchLogRepository;

    /**
     * 배치 로그를 독립 트랜잭션으로 저장합니다.
     * 비즈니스 로직의 트랜잭션이 롤백되더라도 이 메서드의 커밋은 유지됩니다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveBatchLog(String jobName, String status, int totalProcessed,
                             int totalFailed, String messages, long durationMs) {
        BatchLogJpaEntity logEntity = new BatchLogJpaEntity();
        logEntity.setJobName(jobName);
        logEntity.setStatus(status);
        logEntity.setTotalProcessed(totalProcessed);
        logEntity.setTotalFailed(totalFailed);
        logEntity.setMessages(messages);
        logEntity.setDurationMs(durationMs);
        batchLogRepository.save(logEntity);
        log.info("[BatchLog] {} — {} ({}ms, processed={}, failed={})",
                jobName, status, durationMs, totalProcessed, totalFailed);
    }
}
