package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.GovDownloadFormat;
import com.farmbalance.gov.domain.model.GovDownloadType;

import java.io.OutputStream;
import java.time.LocalDate;

/**
 * 지자체 데이터 내보내기(Export) UseCase
 * 요청된 유형/기간/형식에 맞는 데이터를 조회하여 OutputStream에 기록합니다.
 */
public interface DownloadGovDataUseCase {

    /**
     * 데이터를 조회하여 지정된 형식(XLSX/CSV)으로 OutputStream에 기록합니다.
     *
     * @param type      데이터 유형
     * @param format    파일 형식
     * @param startDate 시작일
     * @param endDate   종료일
     * @param town      읍면 필터 (ALL이면 전체)
     * @param out       응답 OutputStream
     */
    void exportData(GovDownloadType type, GovDownloadFormat format,
                    LocalDate startDate, LocalDate endDate,
                    String town, OutputStream out);
}
