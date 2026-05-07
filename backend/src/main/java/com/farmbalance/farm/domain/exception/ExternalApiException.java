package com.farmbalance.farm.domain.exception;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

/**
 * 외부 API 호출에 실패했을 때 발생하는 예외.
 */
public class ExternalApiException extends BusinessException {
    public ExternalApiException() {
        super(ErrorCode.FARM_EXTERNAL_API_FAILED);
    }
}
