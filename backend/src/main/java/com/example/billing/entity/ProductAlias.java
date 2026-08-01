package com.example.billing.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_alias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAlias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alias_id")
    private Long aliasId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "alias_name", length = 100, nullable = false)
    private String aliasName;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "company_id")
    private Long companyId;
}
