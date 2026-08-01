package com.example.billing.service.impl;

import com.example.billing.config.CurrentUserProvider;
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
    private final CurrentUserProvider currentUserProvider;

    private Long companyId() {
        return currentUserProvider.getCompanyId();
    }

    private Invoice requireInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        if (invoice.getCompanyId() != null && !invoice.getCompanyId().equals(companyId())) {
            throw new ResourceNotFoundException("Invoice", "id", id);
        }
        return invoice;
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Long cid = companyId();
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
        if (customer.getCompanyId() != null && !customer.getCompanyId().equals(cid)) {
            throw new ResourceNotFoundException("Customer", "id", request.getCustomerId());
        }

        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (InvoiceRequest.InvoiceItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));
            if (product.getCompanyId() != null && !product.getCompanyId().equals(cid)) {
                throw new ResourceNotFoundException("Product", "id", itemRequest.getProductId());
            }

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            InvoiceItem invoiceItem = InvoiceItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unit("pcs")
                    .price(product.getPrice())
                    .total(itemTotal)
                    .companyId(cid)
                    .build();

            invoiceItems.add(invoiceItem);
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal taxPercent = companyRepository.findById(cid)
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

        String invoiceNumber = generateInvoiceNumber(cid);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .companyId(cid)
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
        return invoiceRepository.findByCompanyId(companyId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InvoiceResponse getInvoiceById(Long id) {
        return mapToResponse(requireInvoice(id));
    }

    @Override
    @Transactional
    public InvoiceResponse markCompleted(Long invoiceId, String gateway) {
        Invoice invoice = requireInvoice(invoiceId);
        invoice.setPaymentStatus("completed");

        if (paymentRepository.findByInvoiceInvoiceId(invoiceId).isEmpty()) {
            Payment cashPayment = Payment.builder()
                    .invoice(invoice)
                    .gateway(gateway != null ? gateway : "cash")
                    .amount(invoice.getTotalAmount())
                    .status("completed")
                    .companyId(invoice.getCompanyId())
                    .build();
            paymentRepository.save(cashPayment);
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long invoiceId) {
        Invoice invoice = requireInvoice(invoiceId);
        if ("completed".equalsIgnoreCase(invoice.getPaymentStatus())) {
            throw new IllegalStateException("Cannot delete a completed invoice");
        }
        invoiceRepository.delete(invoice);
    }

    private String generateInvoiceNumber(Long cid) {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "INV-" + datePart + "-";

        List<String> existing = invoiceRepository.findExistingInvoiceNumbers(prefix, cid);
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
