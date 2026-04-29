package com.farmbalance.gov.domain.model;

/**
 * 지자체 데이터 내보내기 유형
 */
public enum GovDownloadType {
    CULTIVATION, // 재배 현황
    BALANCE,     // 수급 현황
    SALES,       // 판매 데이터
    FARM         // 농가 목록
}
