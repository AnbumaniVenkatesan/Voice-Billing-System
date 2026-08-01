package com.example.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "company")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "company_name", length = 200, nullable = false)
    private String companyName;

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(name = "shop_type", length = 100)
    private String shopType;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "pan_number", length = 50)
    private String panNumber;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "alternate_phone", length = 20)
    private String alternatePhone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "address_line1", length = 300)
    private String addressLine1;

    @Column(name = "address_line2", length = 300)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "pincode", length = 10)
    private String pincode;

    @Column(name = "logo", length = 500)
    private String logo;

    @Column(name = "upi_id", length = 200)
    private String upiId;

    @Column(name = "bank_name", length = 200)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "ifsc_code", length = 30)
    private String ifscCode;

    @Column(name = "invoice_prefix", length = 20)
    private String invoicePrefix;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    private BigDecimal taxPercentage;

    @Column(name = "bill_footer", length = 500)
    private String billFooter;

    @Column(name = "invoice_header", columnDefinition = "TEXT")
    private String invoiceHeader;

    @Column(name = "invoice_footer", columnDefinition = "TEXT")
    private String invoiceFooter;

    @Column(name = "receipt_message", length = 500)
    private String receiptMessage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
