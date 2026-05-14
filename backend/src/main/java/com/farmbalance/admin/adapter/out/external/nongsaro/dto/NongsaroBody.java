package com.farmbalance.admin.adapter.out.external.nongsaro.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class NongsaroBody<T> {
    @JacksonXmlProperty(localName = "items")
    private NongsaroItems<T> items;
}
