package com.farmbalance.farm.application.service;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.WeatherData;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.history.application.port.out.SaveHistoryPort;
import com.farmbalance.history.domain.CultivationHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyWeatherRecordScheduler {

    private final WeatherRecordPort weatherRecordPort;
    private final LoadFarmPort loadFarmPort;
    private final SaveHistoryPort saveHistoryPort;
    private final ManageApiSyncUseCase manageApiSyncUseCase;
    private final ApplicationEventPublisher eventPublisher;

    private static final int YANGPYEONG_STN_ID = 202; // 양평군 ASOS 지점번호

    // 매일 낮 12시에 실행 (기상청 전일 데이터 갱신 시간 등 지연 고려)
    @Scheduled(cron = "0 0 12 * * *")
    @Transactional
    public void recordDailyWeather() {
        try {
            ApiSyncStatus status = manageApiSyncUseCase.getApiSyncStatusByName("WEATHER_RECORD");
            if (status != null && !status.getIsActive()) {
                log.info("[Scheduler] WEATHER_RECORD API가 비활성화되어 있어 스케줄러를 종료합니다.");
                return;
            }
        } catch (Exception e) {
            log.warn("[Scheduler] API 상태 조회 실패. (기본 동작 수행)");
        }

        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("[Scheduler] 전날({}) 날씨 기록 배치를 시작합니다.", yesterday);

        try {
            // 1. 기상청 API 호출 (딱 1번만 호출하여 부하 및 API 한도 최소화)
            WeatherData weatherData = weatherRecordPort.fetchAsosDailyWeather(YANGPYEONG_STN_ID, yesterday);
            log.info("기상 데이터 수신 완료: 기온={}도, 강수량={}mm", weatherData.getAvgTa(), weatherData.getSumRn());

            // 2. 승인 상태의 모든 농장 조회
            List<Farm> activeFarms = loadFarmPort.loadAllFarms().stream()
                    .filter(farm -> com.farmbalance.farm.domain.CertificationStatus.APPROVED.equals(farm.getCertificationStatus()))
                    .collect(Collectors.toList());

            log.info("승인(APPROVED) 상태의 농장 수: {}개", activeFarms.size());

            if (activeFarms.isEmpty()) {
                log.info("승인 상태의 농장이 없어 날씨 기록을 생략합니다.");
                eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_RECORD", "SUCCESS", 0, null));
                return;
            }

            // 3. 일괄 생성을 위한 도메인 엔티티 매핑
            List<CultivationHistory> historyList = activeFarms.stream()
                    .map(farm -> CultivationHistory.createWeatherHistory(
                            farm.getId(),
                            weatherData.getAvgTa(),
                            weatherData.getSumRn(),
                            yesterday))
                    .collect(Collectors.toList());

            // 4. Batch Insert로 DB 부하 최소화
            saveHistoryPort.saveAllHistories(historyList);

            log.info("[Scheduler] 총 {}개의 농장에 날씨 기록 배치를 성공적으로 완료했습니다.", historyList.size());
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_RECORD", "SUCCESS", historyList.size(), null));
            
        } catch (Exception e) {
            log.error("[Scheduler] 기상청 동기화 실패: {}", e.getMessage(), e);
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_RECORD", "FAILED", 0, e.getMessage()));
            throw e;
        }
    }
}
