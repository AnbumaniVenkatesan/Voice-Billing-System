package com.example.billing.service.impl;

import com.example.billing.config.CurrentUserProvider;
import com.example.billing.dto.request.PaymentRequest;
import com.example.billing.dto.response.PaymentResponse;
import com.example.billing.entity.Invoice;
import com.example.billing.entity.Payment;
import com.example.billing.entity.PaymentTransaction;
import com.example.billing.exception.ResourceNotFoundException;
import com.example.billing.repository.InvoiceRepository;
import com.example.billing.repository.PaymentRepository;
import com.example.billing.repository.PaymentTransactionRepository;
import com.example.billing.service.PaymentService;
import com.example.billing.config.PaytmConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaytmConfig paytmConfig;
    private final CurrentUserProvider currentUserProvider;

    private Long companyId() {
        return currentUserProvider.getCompanyId();
    }

    private Invoice requireInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
        if (invoice.getCompanyId() != null && !invoice.getCompanyId().equals(companyId())) {
            throw new ResourceNotFoundException("Invoice", "id", invoiceId);
        }
        return invoice;
    }

    @Override
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        Invoice invoice = requireInvoice(request.getInvoiceId());

        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .invoice(invoice)
                .gateway(request.getGateway())
                .orderId(orderId)
                .amount(invoice.getTotalAmount())
                .status("pending")
                .companyId(invoice.getCompanyId())
                .build();

        Payment saved = paymentRepository.save(payment);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(saved)
                .request("Payment initiated via " + request.getGateway())
                .status("initiated")
                .companyId(invoice.getCompanyId())
                .build();
        paymentTransactionRepository.save(transaction);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponse initiatePaytmPayment(Long invoiceId) {
        Invoice invoice = requireInvoice(invoiceId);

        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .invoice(invoice)
                .gateway("paytm")
                .orderId(orderId)
                .amount(invoice.getTotalAmount())
                .status("initiated")
                .companyId(invoice.getCompanyId())
                .build();

        Payment saved = paymentRepository.save(payment);

        String qrCodeUrl = generatePaytmQRCode(orderId, invoice.getTotalAmount().toString());

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(saved)
                .request("Paytm payment initiated. OrderId: " + orderId)
                .status("initiated")
                .companyId(invoice.getCompanyId())
                .build();
        paymentTransactionRepository.save(transaction);

        PaymentResponse response = mapToResponse(saved);
        response.setQrCodeUrl(qrCodeUrl);
        return response;
    }

    @Override
    @Transactional
    public PaymentResponse handlePaytmCallback(Map<String, String> callbackParams) {
        String orderId = callbackParams.get("ORDERID");
        String transactionId = callbackParams.get("TXNID");
        String status = callbackParams.get("STATUS");

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        payment.setTransactionId(transactionId);

        if ("TXN_SUCCESS".equals(status)) {
            payment.setStatus("completed");
            payment.getInvoice().setPaymentStatus("completed");
        } else {
            payment.setStatus("failed");
            payment.getInvoice().setPaymentStatus("failed");
        }

        Payment saved = paymentRepository.save(payment);
        invoiceRepository.save(payment.getInvoice());

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(saved)
                .response(callbackParams.toString())
                .status(status.equals("TXN_SUCCESS") ? "success" : "failed")
                .companyId(payment.getInvoice() != null ? payment.getInvoice().getCompanyId() : payment.getCompanyId())
                .build();
        paymentTransactionRepository.save(transaction);

        return mapToResponse(saved);
    }

    @Override
    public PaymentResponse getPaymentByInvoiceId(Long invoiceId) {
        requireInvoice(invoiceId);
        Optional<Payment> paymentOpt = paymentRepository.findByInvoiceInvoiceId(invoiceId);
        if (paymentOpt.isEmpty()) {
            throw new ResourceNotFoundException("Payment", "invoiceId", invoiceId);
        }
        return mapToResponse(paymentOpt.get());
    }

    private String generatePaytmQRCode(String orderId, String amount) {
        return "https://merchant.paytm.com/link/" + orderId + "?amount=" + amount;
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .invoiceId(payment.getInvoice().getInvoiceId())
                .invoiceNumber(payment.getInvoice().getInvoiceNumber())
                .gateway(payment.getGateway())
                .orderId(payment.getOrderId())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
