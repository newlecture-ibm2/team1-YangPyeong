package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.GovDomain.*;
import java.util.List;

/** 연도 비교 조회 UseCase */
public interface GetYearCompareUseCase {
    List<YearCompareRow> getYearCompare(Integer baseYear, Integer compareYear, String crop);
}
