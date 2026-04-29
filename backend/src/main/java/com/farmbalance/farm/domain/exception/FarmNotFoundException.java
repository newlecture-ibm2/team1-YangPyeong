package com.farmbalance.farm.domain.exception;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

public class FarmNotFoundException extends BusinessException {
    public FarmNotFoundException() {
        super(ErrorCode.FARM_NOT_FOUND);
    }
}
