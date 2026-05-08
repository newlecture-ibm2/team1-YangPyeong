package com.farmbalance.farm.adapter.in.web.dto;

import com.farmbalance.farm.domain.FarmDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmDocumentDto {
    private String type;
    private String url;
    private String name;

    public FarmDocument toDomain() {
        return FarmDocument.builder()
                .type(this.type)
                .url(this.url)
                .name(this.name)
                .build();
    }

    public static FarmDocumentDto from(FarmDocument domain) {
        if (domain == null) return null;
        return FarmDocumentDto.builder()
                .type(domain.getType())
                .url(domain.getUrl())
                .name(domain.getName())
                .build();
    }
}
