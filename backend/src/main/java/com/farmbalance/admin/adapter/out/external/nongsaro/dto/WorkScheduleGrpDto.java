package com.farmbalance.admin.adapter.out.external.nongsaro.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkScheduleGrpDto {
    @JacksonXmlProperty(localName = "codeNm")
    private String codeNm;

    @JacksonXmlProperty(localName = "kidofcomdtySeCode")
    private String kidofcomdtySeCode;

    @JacksonXmlProperty(localName = "sort")
    private Integer sort;
}
