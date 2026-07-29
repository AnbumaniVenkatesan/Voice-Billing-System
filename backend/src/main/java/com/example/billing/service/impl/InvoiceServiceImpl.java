package com.example.billing.service.impl;

import com.example.billing.dto.request.InvoiceRequest;
import com.example.billing.dto.response.InvoiceResponse;
import com.example.billing.entity.Company;
import com.example.billing.entity.Customer;
import com.example.billing.entity.Invoice;
import com.example.billing.entity.InvoiceItem;
import com.example.billing.entity.Payment;
import com.example.billing.entity.Product;
import com.example.billing.exception.ResourceNotFoundException;
import com.example.billing.repository.CompanyRepository;
import com.example.billing.repository.CustomerRepository;
import com.example.billing.repository.InvoiceRepository;
import com.example.billing.repository.PaymentRepository;
import com.example.billing.repository.ProductRepository;
import com.example.billing.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CompanyRepository companyRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (InvoiceRequest.InvoiceItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            InvoiceItem invoiceItem = InvoiceItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unit("pcs")
                    .price(product.getPrice())
                    .total(itemTotal)
                    .build();

            invoiceItems.add(invoiceItem);
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal taxPercent = companyRepository.findByIsActiveTrue()
                .map(Company::getTaxPercentage)
                .filter(t -> t.compareTo(BigDecimal.ZERO) > 0)
                .orElse(new BigDecimal("3.00"));

        // Inclusive GST: tax is included in product prices
        // Reverse-calculate: gstAmount = subtotal * taxPercent / (100 + taxPercent)
        BigDecimal divisor = BigDecimal.valueOf(100).add(taxPercent);
        BigDecimal gstAmount = subtotal.multiply(taxPercent).divide(divisor, 2, RoundingMode.HALF_UP);
        BigDecimal sgstAmount = gstAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal cgstAmount = gstAmount.subtract(sgstAmount);

        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        // Total is same as subtotal since GST is already included in prices
        BigDecimal totalAmount = subtotal.subtract(discount);

        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .customer(customer)
                .subtotal(subtotal)
                .gstAmount(gstAmount)
                .sgstAmount(sgstAmount)
                .cgstAmount(cgstAmount)
                .discount(discount)
                .totalAmount(totalAmount)
                .paymentStatus("pending")
                .items(invoiceItems)
                .build();

        for (InvoiceItem item : invoiceItems) {
            item.setInvoice(invoice);
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Override
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return mapToResponse(invoice);
    }

    @Override
    public List<InvoiceResponse> getInvoicesByCustomerId(Long customerId) {
        return invoiceRepository.findByCustomer_CustomerId(customerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InvoiceResponse markCompleted(Long invoiceId, String gateway) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
        invoice.setPaymentStatus("completed");

        if (paymentRepository.findByInvoiceInvoiceId(invoiceId).isEmpty()) {
            Payment cashPayment = Payment.builder()
                    .invoice(invoice)
                    .gateway(gateway != null ? gateway : "cash")
                    .amount(invoice.getTotalAmount())
                    .status("completed")
                    .build();
            paymentRepository.save(cashPayment);
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    private String generateInvoiceNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "INV-" + datePart + "-";

        List<String> existing = invoiceRepository.findExistingInvoiceNumbers(prefix);
        int maxSeq = existing.stream()
                .map(s -> s.replace(prefix, ""))
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0);

        return prefix + String.format("%04d", maxSeq + 1);
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        List<InvoiceResponse.InvoiceItemResponse> itemResponses = invoice.getItems() != null
                ? invoice.getItems().stream()
                    .map(item -> InvoiceResponse.InvoiceItemResponse.builder()
                            .invoiceItemId(item.getInvoiceItemId())
                            .productId(item.getProduct().getProductId())
                            .productName(item.getProduct().getProductName())
                            .quantity(item.getQuantity())
                            .unit(item.getUnit())
                            .price(item.getPrice())
                            .total(item.getTotal())
                            .build())
                    .collect(Collectors.toList())
                : new ArrayList<>();

        return InvoiceResponse.builder()
                .invoiceId(invoice.getInvoiceId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .customerId(invoice.getCustomer().getCustomerId())
                .customerName(invoice.getCustomer().getCustomerName())
                .customerPhone(invoice.getCustomer().getPhone())
                .items(itemResponses)
                .subtotal(invoice.getSubtotal())
                .gstAmount(invoice.getGstAmount())
                .sgstAmount(invoice.getSgstAmount() != null ? invoice.getSgstAmount() : BigDecimal.ZERO)
                .cgstAmount(invoice.getCgstAmount() != null ? invoice.getCgstAmount() : BigDecimal.ZERO)
                .discount(invoice.getDiscount())
                .totalAmount(invoice.getTotalAmount())
                .paymentStatus(invoice.getPaymentStatus())
                .invoiceDate(invoice.getInvoiceDate())
                .build();
    }
}
