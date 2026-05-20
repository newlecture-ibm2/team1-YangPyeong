package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.support.CropCultivationEnvMatcher;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class JdbcCropCandidateAdapterSqlTest {

    @Test
    void buildCandidatesSql_allowsLikePatternsWithKoreanWithoutFormatException() {
        String envNameMatch = CropCultivationEnvMatcher.sqlEnvCropNameMatch("c.name", "e.crop_name");
        String nongsaroWorkMatch = CropCultivationEnvMatcher.sqlNongsaroFarmWorkMatch(
                "c.name", "sowing_sch.farm_work_type");
        String nongsaroHarvestMatch = CropCultivationEnvMatcher.sqlNongsaroFarmWorkMatch(
                "c.name", "harvest_sch.farm_work_type");

        assertThatCode(() -> JdbcCropCandidateAdapter.buildCandidatesSql(
                envNameMatch, nongsaroWorkMatch, nongsaroHarvestMatch))
                .doesNotThrowAnyException();

        String sql = JdbcCropCandidateAdapter.buildCandidatesSql(
                envNameMatch, nongsaroWorkMatch, nongsaroHarvestMatch);

        assertThat(sql).contains("LIKE '%파종%'");
        assertThat(sql).contains("NULL::integer   AS crop_growth_days");
        assertThat(sql).doesNotContain("/*ENV_NAME_MATCH*/");
    }
}
