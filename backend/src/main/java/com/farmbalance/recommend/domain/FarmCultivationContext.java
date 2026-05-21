package com.farmbalance.recommend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmCultivationContext {

    private List<CultivationContextItem> items;

    public boolean hasRegistrations() {
        return items != null && !items.isEmpty();
    }

    public List<CultivationContextItem> inSeasonItems() {
        return items.stream().filter(CultivationContextItem::isInSeason).toList();
    }

    public List<CultivationContextItem> plannedOnlyItems() {
        return items.stream().filter(i -> !i.isInSeason()).toList();
    }
}
