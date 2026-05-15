package com.farmbalance.global.batch;

import com.farmbalance.policy.adapter.out.persistence.entity.BatchLogJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.BatchLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * 공통 배치 로그 래퍼 서비스.
 *
 * <p>모든 {@code @Scheduled} 메서드가 이 서비스를 통해 실행하면,
 * 성공/실패/소요 시간이 {@code batch_logs} 테이블에 자동 기록됩니다.</p>
 *
 * <h3>트랜잭션 전략</h3>
 * <ul>
 *   <li>{@code execute()} 자체에는 트랜잭션을 걸지 않습니다.
 *       비즈니스 로직(task)이 자체 트랜잭션을 가질 수 있으므로, 래퍼가 간섭하지 않습니다.</li>
 *   <li>로그 저장({@code saveBatchLog})만 {@code REQUIRES_NEW}로 독립 트랜잭션을 사용합니다.
 *       따라서 비즈니스 로직이 롤백되더라도 실패 로그는 반드시 커밋됩니다.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchLogService {

    private final BatchLogWriter batchLogWriter;

    /** 에러 메시지 최대 길이 (DB TEXT 타입이지만, 과도한 stack trace 방지) */
    private static final int MAX_MESSAGE_LENGTH = 500;

    /**
     * 기본 배치 실행 — 성공/실패만 기록.
     *
     * @param jobName 배치 작업 식별자 (예: "GRAPH_REFRESH", "ORDER_AUTO_ADVANCE")
     * @param task    실행할 배치 로직
     */
    public void execute(String jobName, Runnable task) {
        long start = System.currentTimeMillis();
        String status = "SUCCESS";
        String messages = null;

        try {
            task.run();
        } catch (Exception e) {
            status = "FAILED";
            messages = buildErrorMessage(e);
            log.error("[BatchLog] {} 실패: {}", jobName, e.getMessage(), e);
            throw e; // 원래 스케줄러 쓰레드로 예외 전파
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            try {
                batchLogWriter.saveBatchLog(jobName, status, 0, 0, messages, durationMs);
            } catch (Exception saveEx) {
                // 로그 저장 자체가 실패해도 배치 흐름에는 영향을 주지 않는다
                log.error("[BatchLog] {} 로그 저장 실패: {}", jobName, saveEx.getMessage());
            }
        }
    }

    /**
     * 상세 배치 실행 — 처리 건수, 실패 건수, 메시지를 직접 기록할 수 있는 콜백 방식.
     * PolicySyncScheduler처럼 세부 통계를 기록해야 하는 스케줄러용.
     *
     * @param jobName 배치 작업 식별자
     * @param task    실행 후 {@link BatchResult}를 반환하는 콜백
     */
    public void executeWithResult(String jobName, java.util.function.Supplier<BatchResult> task) {
        long start = System.currentTimeMillis();
        String status = "SUCCESS";
        int totalProcessed = 0;
        int totalFailed = 0;
        String messages = null;

        try {
            BatchResult result = task.get();
            status = result.status() != null ? result.status() : "SUCCESS";
            totalProcessed = result.totalProcessed();
            totalFailed = result.totalFailed();
            messages = result.messages();
        } catch (Exception e) {
            status = "FAILED";
            messages = buildErrorMessage(e);
            log.error("[BatchLog] {} 실패: {}", jobName, e.getMessage(), e);
            throw e;
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            try {
                batchLogWriter.saveBatchLog(jobName, status, totalProcessed, totalFailed, messages, durationMs);
            } catch (Exception saveEx) {
                log.error("[BatchLog] {} 로그 저장 실패: {}", jobName, saveEx.getMessage());
            }
        }
    }

    /**
     * 예외로부터 root cause를 포함한 에러 메시지를 생성합니다.
     * NPE 등 getMessage()가 null인 경우에도 유용한 정보를 남깁니다.
     */
    private String buildErrorMessage(Exception e) {
        StringBuilder sb = new StringBuilder();
        sb.append(e.getClass().getSimpleName());
        if (e.getMessage() != null) {
            sb.append(": ").append(e.getMessage());
        }

        // root cause가 다르면 추가
        Throwable root = e;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        if (root != e) {
            sb.append(" [root: ").append(root.getClass().getSimpleName());
            if (root.getMessage() != null) {
                sb.append(": ").append(root.getMessage());
            }
            sb.append("]");
        }

        // 최대 길이 제한
        if (sb.length() > MAX_MESSAGE_LENGTH) {
            return sb.substring(0, MAX_MESSAGE_LENGTH - 3) + "...";
        }
        return sb.toString();
    }

    /**
     * 배치 실행 결과를 담는 레코드.
     * {@code executeWithResult()} 콜백에서 반환합니다.
     */
    public record BatchResult(
            String status,
            int totalProcessed,
            int totalFailed,
            String messages
    ) {
        /** 간단한 성공 결과 생성 */
        public static BatchResult success(int processed, String messages) {
            return new BatchResult("SUCCESS", processed, 0, messages);
        }

        /** 부분 성공 결과 생성 */
        public static BatchResult withWarnings(int processed, int failed, String messages) {
            return new BatchResult("COMPLETED_WITH_WARNINGS", processed, failed, messages);
        }
    }
}
