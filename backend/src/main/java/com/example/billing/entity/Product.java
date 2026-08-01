package com.example.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", length = 100, nullable = false)
    private String productName;

    @Column(name = "tamil_name", length = 100)
    private String tamilName;

    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "gst_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal gstPercentage;

    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductAlias> aliases = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
