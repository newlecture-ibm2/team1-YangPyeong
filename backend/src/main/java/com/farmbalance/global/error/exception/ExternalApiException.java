package com.farmbalance.global.error.exception;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

public class ExternalApiException extends BusinessException {
    public ExternalApiException(String message) {
        super(ErrorCode.EXTERNAL_API_ERROR, message);
    }

    public ExternalApiException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}

