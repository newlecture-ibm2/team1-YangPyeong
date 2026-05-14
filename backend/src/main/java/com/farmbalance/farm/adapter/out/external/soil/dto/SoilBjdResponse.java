package com.farmbalance.farm.adapter.out.external.soil.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

@Data
@JacksonXmlRootElement(localName = "response")
@JsonIgnoreProperties(ignoreUnknown = true)
public class SoilBjdResponse {

    @JacksonXmlProperty(localName = "header")
    private Header header;

    @JacksonXmlProperty(localName = "body")
    private Body body;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Header {
        @JacksonXmlProperty(localName = "result_Code")
        private String resultCode;

        @JacksonXmlProperty(localName = "result_Msg")
        private String resultMsg;
    }

    @Data
    public static class Body {
        @JacksonXmlElementWrapper(localName = "items")
        @JacksonXmlProperty(localName = "item")
        private List<BjdStatItem> items;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BjdStatItem {
        @JacksonXmlProperty(localName = "stdg_Cd")
        private String stdgCd;

        @JacksonXmlProperty(localName = "bjd_Nm")
        private String bjdNm;

        // pH 분포 면적 (acid_Rfld: 논, acid_Pfld: 밭, acid_Fruit: 과수, acid_Green: 시설)
        @JacksonXmlProperty(localName = "acid_Rfld1_Area") private String acidRfld1; // < 4.5
        @JacksonXmlProperty(localName = "acid_Rfld2_Area") private String acidRfld2; // 4.5~5.0
        @JacksonXmlProperty(localName = "acid_Rfld3_Area") private String acidRfld3; // 5.0~5.5
        @JacksonXmlProperty(localName = "acid_Rfld4_Area") private String acidRfld4; // 5.5~6.0
        @JacksonXmlProperty(localName = "acid_Rfld5_Area") private String acidRfld5; // 6.0~6.5
        @JacksonXmlProperty(localName = "acid_Rfld6_Area") private String acidRfld6; // > 6.5

        @JacksonXmlProperty(localName = "acid_Pfld1_Area") private String acidPfld1;
        @JacksonXmlProperty(localName = "acid_Pfld2_Area") private String acidPfld2;
        @JacksonXmlProperty(localName = "acid_Pfld3_Area") private String acidPfld3;
        @JacksonXmlProperty(localName = "acid_Pfld4_Area") private String acidPfld4;
        @JacksonXmlProperty(localName = "acid_Pfld5_Area") private String acidPfld5;
        @JacksonXmlProperty(localName = "acid_Pfld6_Area") private String acidPfld6;

        // 유기물(OM) 분포 면적
        @JacksonXmlProperty(localName = "om_Rfld1_Area") private String omRfld1; // < 10
        @JacksonXmlProperty(localName = "om_Rfld2_Area") private String omRfld2; // 10~20
        @JacksonXmlProperty(localName = "om_Rfld3_Area") private String omRfld3; // 20~30
        @JacksonXmlProperty(localName = "om_Rfld4_Area") private String omRfld4; // 30~40
        @JacksonXmlProperty(localName = "om_Rfld5_Area") private String omRfld5; // 40~50
        @JacksonXmlProperty(localName = "om_Rfld6_Area") private String omRfld6; // > 50

        @JacksonXmlProperty(localName = "om_Pfld1_Area") private String omPfld1;
        @JacksonXmlProperty(localName = "om_Pfld2_Area") private String omPfld2;
        @JacksonXmlProperty(localName = "om_Pfld3_Area") private String omPfld3;
        @JacksonXmlProperty(localName = "om_Pfld4_Area") private String omPfld4;
        @JacksonXmlProperty(localName = "om_Pfld5_Area") private String omPfld5;
        @JacksonXmlProperty(localName = "om_Pfld6_Area") private String omPfld6;

        // 최종 계산된 결과 저장용 (JSON 응답용)
        private String acidAvg; 
        private String omAvg;
    }
}
