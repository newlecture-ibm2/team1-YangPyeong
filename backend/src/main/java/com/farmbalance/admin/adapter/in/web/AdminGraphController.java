package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.GraphRefreshResponse;
import com.farmbalance.admin.application.service.GraphRefreshService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/graph")
public class AdminGraphController {

    private final GraphRefreshService graphRefreshService;

    // TODO: Require Admin Role
    @PostMapping("/refresh")
    public ResponseEntity<GraphRefreshResponse> refreshGraph() {
        log.info("Manual graph refresh triggered by admin");
        GraphRefreshResponse response = graphRefreshService.refreshGraph();
        if (!response.success()) {
            return ResponseEntity.internalServerError().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
