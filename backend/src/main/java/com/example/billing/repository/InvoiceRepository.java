package com.example.billing.repository;

import com.example.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByCustomer_CustomerId(Long customerId);

    List<Invoice> findByPaymentStatus(String status);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.invoiceDate BETWEEN :start AND :end")
    BigDecimal sumSalesBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.paymentStatus = 'completed' AND i.invoiceDate BETWEEN :start AND :end")
    BigDecimal sumCompletedSalesBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.paymentStatus = 'pending'")
    Long countPendingPayments();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.paymentStatus = 'completed'")
    Long countCompletedPayments();

    List<Invoice> findByInvoiceDateBetweenOrderByInvoiceDateDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT i.invoiceNumber FROM Invoice i WHERE i.invoiceNumber LIKE CONCAT(:prefix, '%')")
    List<String> findExistingInvoiceNumbers(String prefix);

    @Query(value = "SELECT p.product_id, p.product_name, " +
            "COALESCE(SUM(ii.quantity), 0) as total_qty, " +
            "COALESCE(SUM(ii.total), 0) as total_sales " +
            "FROM invoice i " +
            "JOIN invoice_item ii ON i.invoice_id = ii.invoice_id " +
            "JOIN product p ON ii.product_id = p.product_id " +
            "WHERE i.invoice_date BETWEEN :start AND :end " +
            "GROUP BY p.product_id, p.product_name " +
            "ORDER BY total_sales DESC", nativeQuery = true)
    List<Object[]> salesByProduct(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT i.payment_status, " +
            "COALESCE(SUM(i.total_amount), 0) as total " +
            "FROM invoice i " +
            "WHERE i.invoice_date BETWEEN :start AND :end " +
            "GROUP BY i.payment_status", nativeQuery = true)
    List<Object[]> salesByPaymentStatus(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT COALESCE(py.gateway, 'cash') as gateway, " +
            "COALESCE(SUM(COALESCE(py.amount, i.total_amount)), 0) as total " +
            "FROM invoice i " +
            "LEFT JOIN payment py ON i.invoice_id = py.invoice_id " +
            "WHERE i.invoice_date BETWEEN :start AND :end AND i.payment_status = 'completed' " +
            "GROUP BY COALESCE(py.gateway, 'cash')", nativeQuery = true)
    List<Object[]> salesByGateway(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT p.product_id, p.product_name, " +
            "COALESCE(SUM(py.amount), 0) as payment_total " +
            "FROM payment py " +
            "JOIN invoice i ON py.invoice_id = i.invoice_id " +
            "JOIN invoice_item ii ON i.invoice_id = ii.invoice_id " +
            "JOIN product p ON ii.product_id = p.product_id " +
            "WHERE i.invoice_date BETWEEN :start AND :end AND i.payment_status = 'completed' " +
            "AND py.gateway = :gateway " +
            "GROUP BY p.product_id, p.product_name " +
            "ORDER BY payment_total DESC", nativeQuery = true)
    List<Object[]> salesByProductAndGateway(LocalDateTime start, LocalDateTime end, String gateway);
}
