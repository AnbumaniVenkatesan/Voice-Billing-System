package com.example.billing.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {

    private Long customerId;
    private String customerName;
    private String phone;
    private String email;
    private String address;
    private LocalDateTime createdAt;
}
