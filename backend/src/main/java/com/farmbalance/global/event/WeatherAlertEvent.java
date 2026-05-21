package com.farmbalance.global.event;

import com.farmbalance.farm.domain.WeatherData;
import java.time.LocalDate;

/**
 * 일일 기상 데이터 수집 완료 후 발행되는 이벤트.
 * WeatherGuideNotificationScheduler가 수신하여 알림 조건을 판단합니다.
 */
public record WeatherAlertEvent(WeatherData weatherData, LocalDate date) {}
