package com.farmbalance.policy.adapter.out.persistence.adapter;

import com.farmbalance.policy.adapter.out.persistence.entity.PolicyDataJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.PolicyDataRepository;
import com.farmbalance.policy.application.port.out.PolicyQueryPort;
import com.farmbalance.policy.application.port.out.PolicySavePort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;
import com.farmbalance.policy.domain.model.PolicySource;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 정책 Persistence Adapter.
 * Domain ↔ JPA Entity 변환을 담당합니다.
 */
@Component
@RequiredArgsConstructor
public class PolicyPersistenceAdapter implements PolicyQueryPort, PolicySavePort {

    private final PolicyDataRepository repository;

    // ── PolicyQueryPort ──

    @Override
    public List<PolicyData> findByCondition(PolicySearchCondition condition) {
        Page<PolicyDataJpaEntity> page = repository.searchPolicies(
                condition.hasKeyword() ? condition.getKeyword() : null,
                condition.hasRegionCode() ? condition.getRegionCode() : null,
                condition.hasCategory() ? condition.getCategory() : null,
                condition.hasPeriod() ? condition.getPeriod() : null,
                condition.hasMinConfidence() ? condition.getMinConfidence() : null,
                PageRequest.of(condition.getPage(), condition.getSize())
        );
        return page.getContent().stream().map(this::toDomain).toList();
    }

    @Override
    public long countByCondition(PolicySearchCondition condition) {
        Page<PolicyDataJpaEntity> page = repository.searchPolicies(
                condition.hasKeyword() ? condition.getKeyword() : null,
                condition.hasRegionCode() ? condition.getRegionCode() : null,
                condition.hasCategory() ? condition.getCategory() : null,
                condition.hasPeriod() ? condition.getPeriod() : null,
                condition.hasMinConfidence() ? condition.getMinConfidence() : null,
                PageRequest.of(0, 1)
        );
        return page.getTotalElements();
    }

    @Override
    public Optional<PolicyData> findById(Long id) {
        return repository.findById(id)
                .filter(entity -> entity.getDeletedAt() == null)
                .map(this::toDomain);
    }

    @Override
    public List<PolicyData> findAll() {
        return repository.findAll().stream()
                .filter(entity -> entity.getDeletedAt() == null)
                .sorted((a, b) -> {
                    if (b.getCreatedAt() == null) return -1;
                    if (a.getCreatedAt() == null) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::toDomain)
                .toList();
    }

    // ── PolicySavePort ──

    @Override
    @org.springframework.transaction.annotation.Transactional
    public PolicyData save(PolicyData domain) {
        PolicyDataJpaEntity entity;

        if (domain.getId() != null) {
            // 기존 엔티티 갱신
            entity = repository.findById(domain.getId())
                    .orElseThrow(() -> new IllegalStateException("정책 데이터를 찾을 수 없습니다: id=" + domain.getId()));
            entity.updateFrom(
                    domain.getTitle(), domain.getOrganization(), domain.getRegionCode(),
                    domain.getCategory(), domain.getTarget(), domain.getContent(),
                    domain.getSupportAmount(), domain.getApplyStart(), domain.getApplyEnd(),
                    domain.getSourceUrl(), domain.getRawData(), domain.getNormalizedData(),
                    domain.getConfidence(), domain.getFetchedAt()
            );
        } else {
            // 신규 엔티티 생성
            entity = toEntity(domain);
        }

        return toDomain(repository.save(entity));
    }

    @Override
    public Optional<PolicyData> findByExternalIdAndSource(String externalId, String source) {
        return repository.findByExternalIdAndSource(externalId, source)
                .map(this::toDomain);
    }

    // ── 변환 메서드 ──

    private PolicyData toDomain(PolicyDataJpaEntity entity) {
        PolicyData domain = new PolicyData();
        domain.setId(entity.getId());
        domain.setExternalId(entity.getExternalId());
        domain.setSource(PolicySource.fromString(entity.getSource()));
        domain.setTitle(entity.getTitle());
        domain.setOrganization(entity.getOrganization());
        domain.setRegionCode(entity.getRegionCode());
        domain.setCategory(entity.getCategory());
        domain.setTarget(entity.getTarget());
        domain.setContent(entity.getContent());
        domain.setSupportAmount(entity.getSupportAmount());
        domain.setApplyStart(entity.getApplyStart());
        domain.setApplyEnd(entity.getApplyEnd());
        domain.setSourceUrl(entity.getSourceUrl());
        domain.setRawData(entity.getRawData());
        domain.setNormalizedData(entity.getNormalizedData());
        domain.setConfidence(entity.getConfidence());
        domain.setFetchedAt(entity.getFetchedAt());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setUpdatedAt(entity.getUpdatedAt());
        domain.setDeletedAt(entity.getDeletedAt());
        return domain;
    }

    private PolicyDataJpaEntity toEntity(PolicyData domain) {
        return PolicyDataJpaEntity.builder()
                .externalId(domain.getExternalId())
                .source(domain.getSource() != null ? domain.getSource().name() : null)
                .title(domain.getTitle())
                .organization(domain.getOrganization())
                .regionCode(domain.getRegionCode())
                .category(domain.getCategory())
                .target(domain.getTarget())
                .content(domain.getContent())
                .supportAmount(domain.getSupportAmount())
                .applyStart(domain.getApplyStart())
                .applyEnd(domain.getApplyEnd())
                .sourceUrl(domain.getSourceUrl())
                .rawData(domain.getRawData())
                .normalizedData(domain.getNormalizedData())
                .confidence(domain.getConfidence())
                .fetchedAt(domain.getFetchedAt())
                .build();
    }
}
