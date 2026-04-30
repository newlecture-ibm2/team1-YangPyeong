package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.out.FarmHistoryRepository;
import com.farmbalance.farm.application.port.out.FarmRepository;
import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.FarmHistory;
import com.farmbalance.farm.domain.WeatherInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyWeatherRecordScheduler {

    private final WeatherRecordPort weatherRecordPort;
    private final FarmRepository farmRepository;
    private final FarmHistoryRepository farmHistoryRepository;

    private static final int YANGPYEONG_STN_ID = 202; // 양평군 ASOS 지점번호

    // 매일 낮 12시에 실행 (기상청 전일 데이터 갱신 시간 및 지연 고려)
    @Scheduled(cron = "0 0 12 * * *")
    @Transactional
    public void recordDailyWeather() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("[Scheduler] 전날({}) 날씨 기록 배치를 시작합니다.", yesterday);

        try {
            // 1. 기상청 API 호출 (딱 1번만 호출하여 부하 및 API 한도 최소화)
            WeatherInfo weatherInfo = weatherRecordPort.fetchAsosDailyWeather(YANGPYEONG_STN_ID, yesterday);
            log.info("기상 데이터 수신 완료: 기온={}도, 강수량={}mm", weatherInfo.getAvgTa(), weatherInfo.getSumRn());

            // 2. 활성 상태인 모든 농장 조회
            var activeFarms = farmRepository.findAllByStatus("ACTIVE");

            if (activeFarms.isEmpty()) {
                log.info("활성 상태인 농장이 없어 날씨 기록을 생략합니다.");
                return;
            }

            // 3. 일괄 생성을 위한 도메인 엔티티 매핑
            var historyList = activeFarms.stream()
                    .map(farm -> FarmHistory.createWeatherHistory(
                            farm.getId(),
                            weatherInfo.getAvgTa(),
                            weatherInfo.getSumRn(),
                            yesterday
                    ))
                    .collect(Collectors.toList());

            // 4. Batch Insert로 DB 부하 최소화
            farmHistoryRepository.saveAll(historyList);

            log.info("[Scheduler] 총 {}개 농장의 날씨 기록 배치를 성공적으로 완료했습니다.", historyList.size());

        } catch (Exception e) {
            // 5. 예외 처리: 외부 API 통신 실패 등이 스케줄러 중단으로 이어지지 않도록 방어 로직 추가
            log.error("[Scheduler] 날씨 기록 배치 작업 중 오류가 발생했습니다. (date={})", yesterday, e);
        }
    }
}
