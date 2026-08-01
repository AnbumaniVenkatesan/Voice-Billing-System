package com.example.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String ownerName;
    private String shopType;
    private String gstNumber;
    private String panNumber;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String alternatePhone;
    private String email;
    private String website;

    @NotBlank(message = "Address is required")
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

    @NotBlank(message = "Invoice prefix is required")
    private String invoicePrefix;

    private String currency;
    private java.math.BigDecimal taxPercentage;
    private String billFooter;
    private String receiptMessage;
    private String invoiceHeader;
    private String invoiceFooter;

    private String username;
    private String password;

    private String superAdminUsername;
    private String superAdminPassword;
}
