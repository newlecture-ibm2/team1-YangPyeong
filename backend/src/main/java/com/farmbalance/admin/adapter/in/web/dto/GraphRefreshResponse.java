package com.farmbalance.admin.adapter.in.web.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record GraphRefreshResponse(
    boolean success,
    LocalDateTime startedAt,
    LocalDateTime finishedAt,
    long durationMs,
    Map<String, Integer> entityCounts,
    Map<String, Integer> relationCounts,
    String error
) {}
