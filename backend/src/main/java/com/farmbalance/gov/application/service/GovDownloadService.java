package com.farmbalance.gov.application.service;

import com.farmbalance.gov.application.port.in.DownloadGovDataUseCase;
import com.farmbalance.gov.application.port.out.DownloadHistoryPort;
import com.farmbalance.gov.domain.model.DownloadHistory;
import com.farmbalance.gov.domain.model.GovDownloadFormat;
import com.farmbalance.gov.domain.model.GovDownloadType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GovDownloadService implements DownloadGovDataUseCase {

    private final DownloadHistoryPort historyPort;

    @Override
    public byte[] download(GovDownloadType type, GovDownloadFormat format, Long govUserId, String govRegion) {
        String content = govRegion + " " + type.name() + " 다운로드 데이터 (포맷: " + format.name() + ")\n";
        content += "1,홍길동,지역읍...\n";
        byte[] data = content.getBytes();

        DownloadHistory history = DownloadHistory.builder()
                .userId(govUserId)
                .type(type.name())
                .format(format.name())
                .createdAt(LocalDateTime.now())
                .build();
        historyPort.save(history);

        return data;
    }

    @Override
    public String getFileName(GovDownloadType type, GovDownloadFormat format) {
        String ext = format == GovDownloadFormat.CSV ? ".csv" : ".xlsx";
        return type.name().toLowerCase() + "_data" + ext;
    }
}
