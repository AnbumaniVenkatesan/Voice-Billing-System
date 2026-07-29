package com.example.billing.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyResponse {

    private Long companyId;
    private String companyName;
    private String ownerName;
    private String shopType;
    private String gstNumber;
    private String panNumber;
    private String phoneNumber;
    private String alternatePhone;
    private String email;
    private String website;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String district;
    private String state;
    private String country;
    private String pincode;
    private String logo;
    private String upiId;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    private String invoicePrefix;
    private String currency;
    private BigDecimal taxPercentage;
    private String billFooter;
    private String receiptMessage;
    private Boolean isActive;
}
