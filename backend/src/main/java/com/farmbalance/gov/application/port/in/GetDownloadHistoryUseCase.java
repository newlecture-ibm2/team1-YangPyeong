package com.farmbalance.gov.application.port.in;
import com.farmbalance.gov.domain.model.DownloadHistory;
import java.util.List;
public interface GetDownloadHistoryUseCase {
    List<DownloadHistory> getHistory(Long govUserId);
}
