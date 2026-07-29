package com.example.billing.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long paymentId;
    private Long invoiceId;
    private String invoiceNumber;
    private String gateway;
    private String orderId;
    private String transactionId;
    private BigDecimal amount;
    private String status;
    private String qrCodeUrl;
    private LocalDateTime createdAt;
}
