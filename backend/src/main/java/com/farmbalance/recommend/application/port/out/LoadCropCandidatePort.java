package com.farmbalance.recommend.application.port.out;

import java.util.List;

/**
 * 추천 후보 작물 조회 출력 포트
 * Persistence Adapter 또는 External API Adapter가 구현
 */
public interface LoadCropCandidatePort {

    /**
     * 해당 지역에서 재배 가능한 작물 후보 목록을 조회합니다.
     *
     * @param regionCode 법정동 코드 (농장 위치 기반)
     * @return 작물 후보 데이터 목록
     */
    List<CropCandidateData> loadCandidates(String regionCode);
}
