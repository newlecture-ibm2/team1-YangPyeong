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
public class SoilV2Response {

    @JacksonXmlProperty(localName = "header")
    private Header header;

    @JacksonXmlProperty(localName = "body")
    private Body body;

    @Data
    public static class Header {
        @JacksonXmlProperty(localName = "Result_Code")
        private String resultCode;

        @JacksonXmlProperty(localName = "Result_Msg")
        private String resultMsg;
    }

    @Data
    public static class Body {
        @JacksonXmlElementWrapper(localName = "items")
        @JacksonXmlProperty(localName = "item")
        private List<ChemicalItem> items;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChemicalItem {
        @JacksonXmlProperty(localName = "PNU_CD")
        private String pnuCd;

        @JacksonXmlProperty(localName = "ACID")
        private String acid; // pH (산도)

        @JacksonXmlProperty(localName = "OM")
        private String om; // 유기물 함량 (g/kg)

        @JacksonXmlProperty(localName = "VLDPHA")
        private String vldpha; // 유효인산 (mg/kg)

        @JacksonXmlProperty(localName = "POSIFERT_K")
        private String posifertK; // 치환성 칼륨

        @JacksonXmlProperty(localName = "POSIFERT_CA")
        private String posifertCa; // 치환성 칼슘

        @JacksonXmlProperty(localName = "POSIFERT_MG")
        private String posifertMg; // 치환성 마그네슘

        @JacksonXmlProperty(localName = "ELCD")
        private String elcd; // 전기전도도 (EC)

        @JacksonXmlProperty(localName = "EXAM_DT")
        private String examDt; // 검정 일자

        @JacksonXmlProperty(localName = "ADDR_NM")
        private String addrNm; // 주소명
    }
}
