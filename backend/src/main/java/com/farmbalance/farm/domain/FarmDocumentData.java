package com.farmbalance.farm.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@AllArgsConstructor
public class FarmDocumentData {
    private Boolean isValid;
    private String errorMessage;
    private String documentType;
    private String farmOwnerName;
    private String address;
    private String area;
    private String documentIssueNumber;
}
