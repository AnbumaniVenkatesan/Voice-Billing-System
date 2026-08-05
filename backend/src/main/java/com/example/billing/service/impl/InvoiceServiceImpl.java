package com.example.billing.service.impl;

import com.example.billing.config.CurrentUserProvider;
import com.example.billing.dto.request.InvoiceRequest;
import com.example.billing.dto.response.InvoiceResponse;
import com.example.billing.entity.Customer;
import com.example.billing.entity.Invoice;
import com.example.billing.entity.InvoiceItem;
import com.example.billing.entity.Payment;
import com.example.billing.entity.PaymentTransaction;
import com.example.billing.entity.Product;
import com.example.billing.exception.ResourceNotFoundException;
import com.example.billing.repository.CustomerRepository;
import com.example.billing.repository.InvoiceRepository;
import com.example.billing.repository.PaymentRepository;
import com.example.billing.repository.PaymentTransactionRepository;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
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
        Customer customer = resolveCustomer(request.getCustomerId(), cid);

        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;

        for (InvoiceRequest.InvoiceItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));
            if (product.getCompanyId() != null && !product.getCompanyId().equals(cid)) {
                throw new ResourceNotFoundException("Product", "id", itemRequest.getProductId());
            }

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            BigDecimal gstRate = product.getGstPercentage() != null
                    ? product.getGstPercentage()
                    : BigDecimal.ZERO;

            // Inclusive GST: tax is included in the selling price
            BigDecimal itemGst = computeIncludedGst(itemTotal, gstRate);
            BigDecimal itemSgst = itemGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal itemCgst = itemGst.subtract(itemSgst);

            InvoiceItem invoiceItem = InvoiceItem.builder()
                    .productName(product.getProductName())
                    .quantity(itemRequest.getQuantity())
                    .unit("pcs")
                    .price(product.getPrice())
                    .total(itemTotal)
                    .gstPercentage(gstRate)
                    .companyId(cid)
                    .build();

            invoiceItems.add(invoiceItem);
            subtotal = subtotal.add(itemTotal);
            totalSgst = totalSgst.add(itemSgst);
            totalCgst = totalCgst.add(itemCgst);
        }

        BigDecimal gstAmount = totalSgst.add(totalCgst);
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        // Total is same as subtotal minus discount since GST is already included in prices
        BigDecimal totalAmount = subtotal.subtract(discount);

        String invoiceNumber = generateInvoiceNumber(cid);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .companyId(cid)
                .customer(customer)
                .subtotal(subtotal)
                .gstAmount(gstAmount)
                .sgstAmount(totalSgst)
                .cgstAmount(totalCgst)
                .discount(discount)
                .totalAmount(totalAmount)
                .paymentStatus("completed")
                .items(invoiceItems)
                .build();

        for (InvoiceItem item : invoiceItems) {
            item.setInvoice(invoice);
        }

        Invoice saved = invoiceRepository.save(invoice);

        saveCompletedPayment(saved, request.getPaymentMethod());

        return mapToResponse(saved);
    }

    // Every invoice is immediately COMPLETED with a saved payment record.
    // No pending state ever exists.
    private void saveCompletedPayment(Invoice invoice, String paymentMethod) {
        String gateway = paymentMethod != null && !paymentMethod.isBlank()
                ? paymentMethod.toLowerCase()
                : "cash";

        Payment payment = Payment.builder()
                .invoice(invoice)
                .gateway(gateway)
                .amount(invoice.getTotalAmount())
                .status("completed")
                .companyId(invoice.getCompanyId())
                .build();
        Payment savedPayment = paymentRepository.save(payment);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(savedPayment)
                .request("Payment completed via " + gateway)
                .status("success")
                .companyId(invoice.getCompanyId())
                .build();
        paymentTransactionRepository.save(transaction);
    }

    private Customer resolveCustomer(Long customerId, Long cid) {
        if (customerId != null) {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
            if (customer.getCompanyId() != null && !customer.getCompanyId().equals(cid)) {
                throw new ResourceNotFoundException("Customer", "id", customerId);
            }
            return customer;
        }

        return customerRepository.findByCompanyId(cid).stream()
                .filter(c -> "Walk-in Customer".equalsIgnoreCase(c.getCustomerName()))
                .findFirst()
                .orElseGet(() -> customerRepository.save(Customer.builder()
                        .customerName("Walk-in Customer")
                        .phone("9999999999")
                        .companyId(cid)
                        .build()));
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
    public void deleteInvoice(Long invoiceId) {
        Invoice invoice = requireInvoice(invoiceId);
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
                            .productName(item.getProductName())
                            .quantity(item.getQuantity())
                            .unit(item.getUnit())
                            .price(item.getPrice())
                            .total(item.getTotal())
                            .gstPercentage(item.getGstPercentage())
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
                .taxSlabs(buildTaxSlabs(invoice.getItems()))
                .build();
    }

    private BigDecimal computeIncludedGst(BigDecimal amount, BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal divisor = BigDecimal.valueOf(100).add(rate);
        return amount.multiply(rate).divide(divisor, 2, RoundingMode.HALF_UP);
    }

    private List<InvoiceResponse.TaxSlab> buildTaxSlabs(List<InvoiceItem> items) {
        Map<BigDecimal, BigDecimal> sgstByRate = new LinkedHashMap<>();
        Map<BigDecimal, BigDecimal> cgstByRate = new LinkedHashMap<>();
        Map<BigDecimal, BigDecimal> gstByRate = new LinkedHashMap<>();

        if (items != null) {
            for (InvoiceItem item : items) {
                BigDecimal rate = item.getGstPercentage() != null ? item.getGstPercentage() : BigDecimal.ZERO;
                BigDecimal itemTotal = item.getTotal() != null ? item.getTotal() : BigDecimal.ZERO;

                BigDecimal itemGst = computeIncludedGst(itemTotal, rate);
                BigDecimal itemSgst = itemGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                BigDecimal itemCgst = itemGst.subtract(itemSgst);

                sgstByRate.merge(rate, itemSgst, BigDecimal::add);
                cgstByRate.merge(rate, itemCgst, BigDecimal::add);
                gstByRate.merge(rate, itemGst, BigDecimal::add);
            }
        }

        List<InvoiceResponse.TaxSlab> slabs = new ArrayList<>();
        for (Map.Entry<BigDecimal, BigDecimal> entry : sgstByRate.entrySet()) {
            BigDecimal rate = entry.getKey();
            BigDecimal sgstRate = rate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            slabs.add(InvoiceResponse.TaxSlab.builder()
                    .gstRate(rate)
                    .sgstRate(sgstRate)
                    .cgstRate(rate.subtract(sgstRate))
                    .sgstAmount(entry.getValue())
                    .cgstAmount(cgstByRate.get(rate))
                    .gstAmount(gstByRate.get(rate))
                    .build());
        }
        slabs.sort(Comparator.comparing(InvoiceResponse.TaxSlab::getGstRate));
        return slabs;
    }
}
