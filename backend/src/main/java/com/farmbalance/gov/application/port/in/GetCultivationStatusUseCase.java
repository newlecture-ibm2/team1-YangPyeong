package com.farmbalance.gov.application.port.in;
import com.farmbalance.gov.application.result.GovCultivationResult;
import java.util.List;
public interface GetCultivationStatusUseCase {
    List<GovCultivationResult> getCultivationStatus(Integer year, String govRegion, String town, String crop);
}
