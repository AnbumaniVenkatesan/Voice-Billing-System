package com.example.billing.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceResponse {

    private String recognizedText;
    private List<VoiceItem> matchedItems;
    private List<UnmatchedItem> unmatchedItems;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoiceItem {
        private Long productId;
        private String productName;
        private String tamilName;
        private Double quantity;
        private String unit;
        private BigDecimal price;
        private BigDecimal gstPercentage;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnmatchedItem {
        private String spokenText;
        private Double quantity;
        private String unit;
        private List<SuggestedProduct> suggestions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SuggestedProduct {
        private Long productId;
        private String productName;
        private String tamilName;
        private BigDecimal price;
        private BigDecimal gstPercentage;
    }
}
