package com.example.billing.repository;

import com.example.billing.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByProductNameContainingIgnoreCaseAndCompanyId(String name, Long companyId);

    List<Product> findByStatusAndCompanyId(String status, Long companyId);

    @Query(value = "SELECT p.product_id, p.product_name, p.price, " +
            "COALESCE(s.total_qty, 0) as total_qty, " +
            "COALESCE(s.total_sales, 0) as total_sales " +
            "FROM product p " +
            "LEFT JOIN ( " +
            "  SELECT ii.product_name, SUM(ii.quantity) as total_qty, SUM(ii.total) as total_sales " +
            "  FROM invoice_item ii " +
            "  INNER JOIN invoice i ON ii.invoice_id = i.invoice_id " +
            "  WHERE i.invoice_date BETWEEN :start AND :end AND i.company_id = :companyId " +
            "  GROUP BY ii.product_name " +
            ") s ON p.product_name = s.product_name " +
            "WHERE p.status = 'active' AND p.company_id = :companyId " +
            "ORDER BY total_sales DESC", nativeQuery = true)
    List<Object[]> findProductSales(LocalDateTime start, LocalDateTime end, Long companyId);

    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) AND p.companyId = :companyId")
    List<Product> searchByKeyword(String keyword, Long companyId);

    List<Product> findByCompanyId(Long companyId);
}
