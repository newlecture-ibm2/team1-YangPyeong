package com.farmbalance.farm.adapter.out.persistence.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmbalance.farm.domain.FarmDocumentData;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class FarmDocumentDataConverter implements AttributeConverter<FarmDocumentData, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(FarmDocumentData attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to convert documentData to JSON", e);
        }
    }

    @Override
    public FarmDocumentData convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(dbData, FarmDocumentData.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to convert JSON to documentData", e);
        }
    }
}
