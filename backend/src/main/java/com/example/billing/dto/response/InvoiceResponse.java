package com.example.billing.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {

    private Long invoiceId;
    private String invoiceNumber;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private List<InvoiceItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal gstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal cgstAmount;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private LocalDateTime invoiceDate;
    private List<TaxSlab> taxSlabs;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItemResponse {

        private Long invoiceItemId;
        private Long productId;
        private String productName;
        private Double quantity;
        private String unit;
        private BigDecimal price;
        private BigDecimal total;
        private BigDecimal gstPercentage;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaxSlab {

        private BigDecimal gstRate;
        private BigDecimal sgstRate;
        private BigDecimal cgstRate;
        private BigDecimal sgstAmount;
        private BigDecimal cgstAmount;
        private BigDecimal gstAmount;
    }
}
