package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminFarmCrop;

import java.util.List;

/**
 * 농장-작물 연결 조회 / 대시보드 통계용 Output Port
 */
public interface AdminFarmCropPort {

    List<AdminFarmCrop> findByFarmId(Long farmId);

    List<AdminFarmCrop> findAll();
}
