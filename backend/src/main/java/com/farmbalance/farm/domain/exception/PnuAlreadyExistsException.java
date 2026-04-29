package com.farmbalance.farm.domain.exception;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

public class PnuAlreadyExistsException extends BusinessException {
    public PnuAlreadyExistsException() {
        super(ErrorCode.FARM_PNU_DUPLICATE);
    }
}
