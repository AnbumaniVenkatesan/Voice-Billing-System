package com.example.billing.repository;

import com.example.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByInvoiceInvoiceId(Long invoiceId);

    List<Payment> findByStatus(String status);

    List<Payment> findByGateway(String gateway);
}
