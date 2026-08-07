package com.example.billing.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    private Long productId;

    @NotBlank(message = "Product name is required")
    private String productName;

    private String tamilName;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    @DecimalMin(value = "0.0", message = "GST percentage cannot be negative")
    private BigDecimal gstPercentage;

    private String status;

    private List<String> aliases;
}
