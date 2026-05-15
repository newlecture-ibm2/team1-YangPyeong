package com.farmbalance.admin.adapter.out.external.nongsaro.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JacksonXmlRootElement(localName = "response")
public class NongsaroApiResponse<T> {
    @JacksonXmlProperty(localName = "header")
    private NongsaroHeader header;

    @JacksonXmlProperty(localName = "body")
    private NongsaroBody<T> body;
}
