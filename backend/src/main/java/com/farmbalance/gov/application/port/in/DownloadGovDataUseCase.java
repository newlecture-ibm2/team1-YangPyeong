package com.farmbalance.gov.application.port.in;
import com.farmbalance.gov.domain.model.GovDownloadFormat;
import com.farmbalance.gov.domain.model.GovDownloadType;
public interface DownloadGovDataUseCase {
    byte[] download(GovDownloadType type, GovDownloadFormat format, Long govUserId, String govRegion);
    String getFileName(GovDownloadType type, GovDownloadFormat format);
}
