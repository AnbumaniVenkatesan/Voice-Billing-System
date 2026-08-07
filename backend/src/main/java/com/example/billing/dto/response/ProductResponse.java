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
public class ProductResponse {

    private Long productId;
    private String productName;
    private String tamilName;
    private BigDecimal price;
    private BigDecimal gstPercentage;
    private String status;
    private LocalDateTime createdAt;
    private List<String> aliases;
}
