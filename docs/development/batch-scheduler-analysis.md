# 배치 스케줄러(Batch Scheduler) 현황 분석 및 공통 로깅 구조 개선안

> **작성일**: 2026-05-14  
> **상태**: 분석 완료 (마이그레이션 통합 후 진행 대기)  
> **목표**: 현재 프로젝트의 모든 `@Scheduled` 배치 흐름을 분석하고, 기존 `batch_logs` 테이블을 재사용하여 "공통 배치 로그 기록 구조"로 최소 범위 내에서 개선 가능한 구조를 제안.

---

## 1. 현재 존재하는 배치 목록 (총 6개)

현재 프로젝트 내에 존재하는 `@Scheduled` 배치는 다음과 같습니다.

1. **`PolicySyncScheduler`** (매일 03:00) : 지자체 정책 동기화
2. **`GraphRefreshScheduler`** (매일 03:00) : AI GraphRAG 데이터 갱신
3. **`UserAccountMaintenanceScheduler.finalizePendingWithdrawals`** (매일 00:00) : 탈퇴 유예 만료 처리
4. **`UserAccountMaintenanceScheduler.anonymizeWithdrawnUsers`** (매일 00:00) : 탈퇴 계정 비식별화
5. **`OrderAutoCompleteScheduler.autoAdvanceOrders`** (매 1시간) : 주문 배송/완료 자동 상태 변경
6. **`DailyWeatherRecordScheduler.recordDailyWeather`** (매일 12:00) : 기상청 날씨 데이터 기록

---

## 2. 현재 로그 기록 상태 분석

* **`PolicySyncScheduler`**: 유일하게 `BatchLogJpaEntity`를 직접 생성하고 `try-catch-finally` 블록을 통해 성공/실패 여부를 `batch_logs` 테이블에 저장하고 있습니다. (`total_processed`, `failed` 등 기록)
* **나머지 5개 스케줄러**: DB에 실행 이력을 남기지 않으며, SLF4J (`log.info`, `log.error`) 콘솔 로그에만 의존하고 있습니다.
* **`batch_logs` 테이블 스키마 구조 (V40)**:
  `id`, `job_name`, `status`, `total_processed`, `total_failed`, `messages`, `created_at`으로 구성되어 있습니다.

---

## 3. 현재 구조의 문제점

* **기록의 파편화**: DB에 이력이 남지 않아, 서버 장애 발생 시 로그 파일이나 콘솔을 뒤져보지 않으면 어떤 배치가 성공/실패했는지 즉각적인 추적이 어렵습니다.
* **소요 시간(Duration) 누락**: 현재 `batch_logs` 테이블에는 `created_at` 컬럼만 존재하고, 완료 시간이나 `duration` 컬럼이 없어 배치 수행 성능이나 타임아웃 징후를 모니터링할 수 없습니다.
* **보일러플레이트 중복**: `PolicySyncScheduler`처럼 매번 Entity를 생성하고 예외 처리 및 저장을 직접 구현하면, 향후 추가될 모든 배치에 중복 코드가 발생합니다.
* **Transaction 롤백 위험**: 일부 배치는 Scheduler 메서드 자체에 `@Transactional`이 걸려있어, 예외 발생 시 배치 전체가 롤백되면서 실패 로그(`batch_logs`)조차 DB에 커밋되지 않고 누락될 위험성이 존재합니다.

---

## 4. 최소 개선안 (MVP 제안)

AOP(어노테이션 기반 자동화)나 복잡한 배치 프레임워크(Spring Batch 등) 남발 없이, 자바의 람다(`Runnable`, `Supplier`)를 활용한 얇은 **공통 유틸리티 서비스(`BatchLogService`) 1개만 추가**하는 것을 제안합니다.

1. **테이블 스키마 미세 조정 (권장)**
   - `batch_logs` 테이블에 `duration_ms`(BIGINT) 컬럼 하나만 추가.
2. **`BatchLogService` 작성**
   - 람다(Lambda)로 실행할 로직을 넘겨받아 `try-catch-finally`로 감싸서 실행 전후의 시간차(duration)와 성공/실패 상태를 독립된 트랜잭션으로 `batch_logs`에 기록합니다.

---

## 5. 추천 구조 (설계 예시)

### [BatchLogService.java]
```java
@Service
@RequiredArgsConstructor
public class BatchLogService {
    private final BatchLogRepository batchLogRepository;

    // 트랜잭션 전파를 분리하여 예외 시에도 로그는 무조건 남게 함
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void execute(String jobName, Runnable task) {
        BatchLogJpaEntity log = new BatchLogJpaEntity();
        log.setJobName(jobName);
        long start = System.currentTimeMillis();

        try {
            task.run();
            log.setStatus("SUCCESS");
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setMessages(e.getMessage());
            throw e; // 원래 스케줄러 쓰레드로 예외 전파
        } finally {
            log.setDurationMs(System.currentTimeMillis() - start);
            batchLogRepository.save(log);
        }
    }
}
```

### [기존 스케줄러 적용 예시]
```java
@Scheduled(cron = "0 0 3 * * *")
public void scheduleGraphRefresh() {
    // 내부 비즈니스 로직은 그대로 두고, 메서드 호출만 래핑
    batchLogService.execute("GRAPH_REFRESH", () -> graphRefreshService.refreshGraph());
}
```

---

## 6. 위험 요소 및 주의 사항

* **@Transactional 결합도 문제**: 
  `OrderAutoCompleteScheduler`나 `DailyWeatherRecordScheduler`의 경우, 현재 `@Scheduled`가 붙은 메서드에 `@Transactional`이 같이 붙어있습니다. DB 로그 기록과 비즈니스 로직이 한 트랜잭션으로 묶여버리면 실패 로그 기록이 취소될 수 있으므로, 로직을 별도의 내부 Service 메서드로 빼서 `@Transactional`을 걸고, Scheduler 계층은 단순히 `BatchLogService`를 호출하기만 하는 형태로 관심사를 분리해야 안전합니다.

## 7. 하지 말아야 할 과한 설계 (Anti-patterns)

❌ **`@BatchLogging` 등 커스텀 어노테이션 제작** (AOP 기반)
- 내부 동작이 숨겨져서 트랜잭션 롤백 시점이나 예외 처리 디버깅이 까다로워집니다.

❌ **`BaseBatchJob` 같은 상속(Template Method) 강제**
- 기존 6개 스케줄러의 클래스 구조를 전면 수정해야 하므로 위험도가 높습니다.

❌ **Spring Batch 프레임워크 (Job, Step) 전면 도입**
- 현재 시스템의 가벼운 배치 흐름에 비해 압도적인 오버스펙(Over-engineering)입니다.
