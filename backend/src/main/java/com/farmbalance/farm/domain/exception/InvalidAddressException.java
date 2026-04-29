package com.farmbalance.farm.domain.exception;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

/**
 * 주소를 좌표로 변환할 수 없을 때 발생하는 예외.
 */
public class InvalidAddressException extends BusinessException {
    public InvalidAddressException() {
        super(ErrorCode.FARM_INVALID_ADDRESS);
    }
}
