package com.farmbalance.global.report.adapter;

import com.farmbalance.global.report.domain.Report;
import com.farmbalance.global.report.port.ReportPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReportPersistenceAdapter implements ReportPort {

    private final ReportJpaRepository reportJpaRepository;

    @Override
    public Report save(Report report) {
        ReportJpaEntity entity = ReportJpaEntity.fromDomain(report);
        return reportJpaRepository.save(entity).toDomain();
    }

    @Override
    public boolean existsByTargetAndReporter(String targetType, Long targetId, Long reporterId) {
        return reportJpaRepository.existsByTargetTypeAndTargetIdAndReporterId(targetType, targetId, reporterId);
    }

    @Override
    public Page<Report> findByReporterId(Long reporterId, Pageable pageable) {
        return reportJpaRepository.findByReporterIdOrderByCreatedAtDesc(reporterId, pageable)
                .map(ReportJpaEntity::toDomain);
    }
}
