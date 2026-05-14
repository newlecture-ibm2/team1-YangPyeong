package com.farmbalance.admin.adapter.out.external.nongsaro.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkScheduleLstDto {
    @JacksonXmlProperty(localName = "cntntsNo")
    private String cntntsNo;

    @JacksonXmlProperty(localName = "sj")
    private String sj;

    @JacksonXmlProperty(localName = "fileDownUrlInfo")
    private String fileDownUrlInfo;

    @JacksonXmlProperty(localName = "fileName")
    private String fileName;
}
