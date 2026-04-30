package com.farmbalance.policy.application.service;

import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.application.port.out.PolicySavePort;
import com.farmbalance.policy.domain.model.PolicyData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 정책 동기화 서비스.
 * 여러 외부 소스(PolicyExternalFetchPort 구현체들)에서 정책을 수집하여
 * external_id + source 기준으로 upsert합니다.
 *
 * ⚠️ 앱 기동 시 자동 호출되지 않습니다.
 * POST /api/admin/policies/sync 수동 트리거에서만 실행됩니다.
 *
 * 외부 API 실패 시에도 다른 소스 수집은 계속 진행합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PolicySyncService implements SyncPolicyUseCase {

    private final List<PolicyExternalFetchPort> fetchPorts;
    private final PolicySavePort policySavePort;

    @Override
    @Transactional
    public SyncResult syncPolicies() {
        int totalFetched = 0;
        int totalCreated = 0;
        int totalUpdated = 0;
        int totalFailed = 0;

        for (PolicyExternalFetchPort fetchPort : fetchPorts) {
            String sourceName = fetchPort.getSourceName();
            try {
                log.info("[정책 동기화] {} 소스 수집 시작", sourceName);
                List<PolicyData> fetched = fetchPort.fetchPolicies();
                totalFetched += fetched.size();

                for (PolicyData policyData : fetched) {
                    try {
                        boolean isNew = upsertPolicy(policyData);
                        if (isNew) {
                            totalCreated++;
                        } else {
                            totalUpdated++;
                        }
                    } catch (Exception e) {
                        totalFailed++;
                        log.warn("[정책 동기화] 개별 정책 저장 실패 — externalId={}, source={}: {}",
                                policyData.getExternalId(), sourceName, e.getMessage());
                    }
                }

                log.info("[정책 동기화] {} 소스 수집 완료 — {}건", sourceName, fetched.size());

            } catch (Exception e) {
                log.error("[정책 동기화] {} 소스 수집 전체 실패: {}", sourceName, e.getMessage(), e);
            }
        }

        return new SyncResult(totalFetched, totalCreated, totalUpdated, totalFailed);
    }

    /**
     * external_id + source 기준 upsert.
     * 기존 데이터가 있으면 필드 갱신, 없으면 새로 생성.
     *
     * @return true이면 신규 생성, false이면 기존 갱신
     */
    private boolean upsertPolicy(PolicyData incoming) {
        Optional<PolicyData> existingOpt = policySavePort
                .findByExternalIdAndSource(incoming.getExternalId(), incoming.getSource().name());

        if (existingOpt.isPresent()) {
            // 기존 데이터 갱신
            PolicyData existing = existingOpt.get();
            existing.setTitle(incoming.getTitle());
            existing.setOrganization(incoming.getOrganization());
            existing.setRegionCode(incoming.getRegionCode());
            existing.setCategory(incoming.getCategory());
            existing.setTarget(incoming.getTarget());
            existing.setContent(incoming.getContent());
            existing.setSupportAmount(incoming.getSupportAmount());
            existing.setApplyStart(incoming.getApplyStart());
            existing.setApplyEnd(incoming.getApplyEnd());
            existing.setSourceUrl(incoming.getSourceUrl());
            existing.setRawData(incoming.getRawData());
            existing.setFetchedAt(LocalDateTime.now());
            policySavePort.save(existing);
            return false;
        } else {
            // 신규 생성
            incoming.setFetchedAt(LocalDateTime.now());
            policySavePort.save(incoming);
            return true;
        }
    }
}
