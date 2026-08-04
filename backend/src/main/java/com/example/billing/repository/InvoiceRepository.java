package com.example.billing.repository;

import com.example.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumberAndCompanyId(String invoiceNumber, Long companyId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.companyId = :companyId AND i.invoiceDate BETWEEN :start AND :end")
    BigDecimal sumSalesBetween(LocalDateTime start, LocalDateTime end, Long companyId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.paymentStatus = 'completed' AND i.companyId = :companyId AND i.invoiceDate BETWEEN :start AND :end")
    BigDecimal sumCompletedSalesBetween(LocalDateTime start, LocalDateTime end, Long companyId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.companyId = :companyId")
    BigDecimal sumTotalRevenue(Long companyId);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.companyId = :companyId AND i.invoiceDate BETWEEN :start AND :end")
    Long countInvoicesBetween(LocalDateTime start, LocalDateTime end, Long companyId);

    @Query("SELECT COALESCE(SUM(ii.quantity), 0) FROM InvoiceItem ii WHERE ii.companyId = :companyId")
    BigDecimal sumProductsSold(Long companyId);

    List<Invoice> findByCompanyIdAndInvoiceDateBetweenOrderByInvoiceDateDesc(Long companyId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT i.invoiceNumber FROM Invoice i WHERE i.companyId = :companyId AND i.invoiceNumber LIKE CONCAT(:prefix, '%')")
    List<String> findExistingInvoiceNumbers(String prefix, Long companyId);

    List<Invoice> findByCompanyId(Long companyId);

    @Query(value = "SELECT p.product_id, p.product_name, " +
            "COALESCE(SUM(ii.quantity), 0) as total_qty, " +
            "COALESCE(SUM(ii.total), 0) as total_sales " +
            "FROM invoice i " +
            "JOIN invoice_item ii ON i.invoice_id = ii.invoice_id " +
            "JOIN product p ON ii.product_id = p.product_id " +
            "WHERE i.invoice_date BETWEEN :start AND :end AND i.company_id = :companyId " +
            "GROUP BY p.product_id, p.product_name " +
            "ORDER BY total_sales DESC", nativeQuery = true)
    List<Object[]> salesByProduct(LocalDateTime start, LocalDateTime end, Long companyId);

    @Query(value = "SELECT COALESCE(py.gateway, 'cash') as gateway, " +
            "COALESCE(SUM(COALESCE(py.amount, i.total_amount)), 0) as total " +
            "FROM invoice i " +
            "LEFT JOIN payment py ON i.invoice_id = py.invoice_id " +
            "WHERE i.invoice_date BETWEEN :start AND :end AND i.payment_status = 'completed' AND i.company_id = :companyId " +
            "GROUP BY COALESCE(py.gateway, 'cash')", nativeQuery = true)
    List<Object[]> salesByGateway(LocalDateTime start, LocalDateTime end, Long companyId);

    @Query(value = "SELECT p.product_id, p.product_name, " +
            "COALESCE(SUM(py.amount), 0) as payment_total " +
            "FROM payment py " +
            "JOIN invoice i ON py.invoice_id = i.invoice_id " +
            "JOIN invoice_item ii ON i.invoice_id = ii.invoice_id " +
            "JOIN product p ON ii.product_id = p.product_id " +
            "WHERE i.invoice_date BETWEEN :start AND :end AND i.payment_status = 'completed' " +
            "AND py.gateway = :gateway AND i.company_id = :companyId " +
            "GROUP BY p.product_id, p.product_name " +
            "ORDER BY payment_total DESC", nativeQuery = true)
    List<Object[]> salesByProductAndGateway(LocalDateTime start, LocalDateTime end, String gateway, Long companyId);
}
