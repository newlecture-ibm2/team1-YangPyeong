package com.farmbalance.policy.adapter.in.scheduler;

import com.farmbalance.global.batch.BatchLogService;
import com.farmbalance.policy.application.service.GraphRefreshService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "graph.refresh.enabled", havingValue = "true", matchIfMissing = false)
public class GraphRefreshScheduler {

    private final GraphRefreshService graphRefreshService;
    private final BatchLogService batchLogService;

    // 매일 새벽 3시 실행
    @Scheduled(cron = "${graph.refresh.cron:0 0 3 * * *}", zone = "Asia/Seoul")
    public void scheduleGraphRefresh() {
        log.info("Scheduled graph refresh started.");
        // TODO: 정책 크롤링/정규화 배치와 순서 관계
        // 정책 sync가 먼저 돌고 graph refresh가 나중에 도는 것이 이상적
        // (예: 02:00 policy sync -> 03:00 graph refresh)
        batchLogService.execute("GRAPH_REFRESH", () -> graphRefreshService.refreshGraph());
    }
}

