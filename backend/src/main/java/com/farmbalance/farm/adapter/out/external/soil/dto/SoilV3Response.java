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
public class SoilV3Response {

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
        private List<SoilItem> items;

        @JacksonXmlProperty(localName = "numOfRows")
        private Integer numOfRows;

        @JacksonXmlProperty(localName = "pageNo")
        private Integer pageNo;

        @JacksonXmlProperty(localName = "totalCount")
        private Integer totalCount;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SoilItem {
        @JacksonXmlProperty(localName = "PNU_Cd")
        private String pnuCd;

        @JacksonXmlProperty(localName = "Soil_Color_Cd")
        private String soilColorCd;

        @JacksonXmlProperty(localName = "Soil_Structure_Cd")
        private String soilStructureCd;

        @JacksonXmlProperty(localName = "Deepsoil_Color_Cd")
        private String deepsoilColorCd;

        @JacksonXmlProperty(localName = "Matrix_Cd")
        private String matrixCd;

        @JacksonXmlProperty(localName = "Soildra_Cd")
        private String soildraCd; // 배수등급

        @JacksonXmlProperty(localName = "Vldsoildep_Cd")
        private String vldsoildepCd; // 유효토심

        @JacksonXmlProperty(localName = "Erosion_Cd")
        private String erosionCd;

        @JacksonXmlProperty(localName = "Surtture_Cd")
        private String surttureCd; // 토성

        @JacksonXmlProperty(localName = "Sur_Ston_Cd")
        private String surStonCd;

        @JacksonXmlProperty(localName = "Soil_Type_Geo_Cd")
        private String soilTypeGeoCd;

        @JacksonXmlProperty(localName = "Accu_Style_Cd")
        private String accuStyleCd;

        @JacksonXmlProperty(localName = "Main_Order_Cd")
        private String mainOrderCd;

        @JacksonXmlProperty(localName = "Sub_Order_Cd")
        private String subOrderCd;

        @JacksonXmlProperty(localName = "Grategroup_Cd")
        private String grategroupCd;

        @JacksonXmlProperty(localName = "Main_Landuse_Cd")
        private String mainLanduseCd;

        @JacksonXmlProperty(localName = "Soil_Use_Rec_Cd")
        private String soilUseRecCd;

        @JacksonXmlProperty(localName = "Soil_Type_Cd")
        private String soilTypeCd;

        @JacksonXmlProperty(localName = "Rfld_Grd_Cd")
        private String rfldGrdCd;

        @JacksonXmlProperty(localName = "Paddy_Factor_Cd")
        private String paddyFactorCd;

        @JacksonXmlProperty(localName = "Pfld_Grd_Cd")
        private String pfldGrdCd;

        @JacksonXmlProperty(localName = "Upland_Factor_Cd")
        private String uplandFactorCd;

        @JacksonXmlProperty(localName = "Fruit_Grd_Cd")
        private String fruitGrdCd;

        @JacksonXmlProperty(localName = "Fruit_Factor_Cd")
        private String fruitFactorCd;

        @JacksonXmlProperty(localName = "Pasture_Grd_Cd")
        private String pastureGrdCd;

        @JacksonXmlProperty(localName = "Grass_Factor_Cd")
        private String grassFactorCd;

        @JacksonXmlProperty(localName = "Frst_Grd_Cd")
        private String frstGrdCd;

        @JacksonXmlProperty(localName = "Forest_Factor_Cd")
        private String forestFactorCd;
    }
}
