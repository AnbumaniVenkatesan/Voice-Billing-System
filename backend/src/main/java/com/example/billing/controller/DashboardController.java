package com.example.billing.controller;

import com.example.billing.config.CurrentUserProvider;
import com.example.billing.repository.InvoiceRepository;
import com.example.billing.repository.ProductRepository;
import com.example.billing.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProductRepository productRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Long companyId = currentUserProvider.getCompanyId();
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("totalProducts", productRepository.findByCompanyId(companyId).size());

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        BigDecimal todaySales = invoiceRepository.sumSalesBetween(todayStart, todayEnd, companyId);
        dashboard.put("todaySales", todaySales);

        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime monthEnd = LocalDateTime.of(LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()), LocalTime.MAX);
        BigDecimal monthlySales = invoiceRepository.sumSalesBetween(monthStart, monthEnd, companyId);
        dashboard.put("monthlySales", monthlySales);

        dashboard.put("pendingPayments", invoiceRepository.countPendingPayments(companyId));
        dashboard.put("completedPayments", invoiceRepository.countCompletedPayments(companyId));

        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProductDetails() {
        Long companyId = currentUserProvider.getCompanyId();
        Map<String, Object> result = new HashMap<>();

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime monthEnd = LocalDateTime.of(LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()), LocalTime.MAX);

        List<Object[]> todaySales = productRepository.findProductSales(todayStart, todayEnd, companyId);
        List<Object[]> monthlySales = productRepository.findProductSales(monthStart, monthEnd, companyId);

        List<Map<String, Object>> products = new ArrayList<>();
        Set<Long> addedProductIds = new HashSet<>();

        for (Object[] row : todaySales) {
            Map<String, Object> product = new HashMap<>();
            Long productId = ((Number) row[0]).longValue();
            product.put("productId", productId);
            product.put("productName", row[1]);
            product.put("stock", row[2]);
            product.put("price", row[3]);
            product.put("todayQty", ((Number) row[4]).doubleValue());
            product.put("todaySales", row[5]);
            product.put("monthlyQty", 0.0);
            product.put("monthlySales", BigDecimal.ZERO);
            addedProductIds.add(productId);
            products.add(product);
        }

        for (Object[] row : monthlySales) {
            Long productId = ((Number) row[0]).longValue();
            boolean found = false;
            for (Map<String, Object> p : products) {
                if (p.get("productId").equals(productId)) {
                    p.put("monthlyQty", ((Number) row[4]).doubleValue());
                    p.put("monthlySales", row[5]);
                    found = true;
                    break;
                }
            }
            if (!found) {
                Map<String, Object> product = new HashMap<>();
                product.put("productId", productId);
                product.put("productName", row[1]);
                product.put("stock", row[2]);
                product.put("price", row[3]);
                product.put("todayQty", 0.0);
                product.put("todaySales", BigDecimal.ZERO);
                product.put("monthlyQty", ((Number) row[4]).doubleValue());
                product.put("monthlySales", row[5]);
                products.add(product);
            }
        }

        products.sort((a, b) -> {
            BigDecimal salesA = (BigDecimal) a.get("monthlySales");
            BigDecimal salesB = (BigDecimal) b.get("monthlySales");
            return salesB.compareTo(salesA);
        });

        result.put("products", products);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/today-sales")
    public ResponseEntity<Map<String, Object>> getTodaySales() {
        Long companyId = currentUserProvider.getCompanyId();
        Map<String, Object> result = new HashMap<>();

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        BigDecimal totalSales = invoiceRepository.sumCompletedSalesBetween(todayStart, todayEnd, companyId);
        result.put("total", totalSales);

        List<Object[]> gatewaySales = invoiceRepository.salesByGateway(todayStart, todayEnd, companyId);
        Map<String, BigDecimal> gatewayMap = new HashMap<>();
        for (Object[] row : gatewaySales) {
            String gateway = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            gatewayMap.put(gateway, amount);
        }
        result.put("upiTotal", gatewayMap.getOrDefault("upi", BigDecimal.ZERO));
        result.put("cashTotal", gatewayMap.getOrDefault("cash", BigDecimal.ZERO));
        result.put("paytmTotal", gatewayMap.getOrDefault("paytm", BigDecimal.ZERO));
        result.put("otherTotal", gatewayMap.entrySet().stream()
                .filter(e -> !e.getKey().equals("upi") && !e.getKey().equals("cash") && !e.getKey().equals("paytm"))
                .map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Object[]> productSales = invoiceRepository.salesByProduct(todayStart, todayEnd, companyId);
        List<Map<String, Object>> productList = new ArrayList<>();
        for (Object[] row : productSales) {
            Map<String, Object> product = new HashMap<>();
            product.put("productId", ((Number) row[0]).longValue());
            product.put("productName", row[1]);
            product.put("totalQty", ((Number) row[2]).doubleValue());
            product.put("totalSales", row[3]);
            productList.add(product);
        }
        result.put("productSales", productList);
        result.put("date", LocalDate.now().toString());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/monthly-sales")
    public ResponseEntity<Map<String, Object>> getMonthlySales(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        Map<String, Object> result = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Long companyId = currentUserProvider.getCompanyId();

        LocalDate fromDate;
        LocalDate toDate;
        if (from != null && to != null) {
            fromDate = LocalDate.parse(from, formatter);
            toDate = LocalDate.parse(to, formatter);
        } else {
            fromDate = LocalDate.now().withDayOfMonth(1);
            toDate = LocalDate.now();
        }

        LocalDateTime start = LocalDateTime.of(fromDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(toDate, LocalTime.MAX);

        BigDecimal totalSales = invoiceRepository.sumCompletedSalesBetween(start, end, companyId);
        result.put("total", totalSales);

        List<Object[]> gatewaySales = invoiceRepository.salesByGateway(start, end, companyId);
        Map<String, BigDecimal> gatewayMap = new HashMap<>();
        for (Object[] row : gatewaySales) {
            String gateway = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            gatewayMap.put(gateway, amount);
        }
        result.put("upiTotal", gatewayMap.getOrDefault("upi", BigDecimal.ZERO));
        result.put("cashTotal", gatewayMap.getOrDefault("cash", BigDecimal.ZERO));
        result.put("paytmTotal", gatewayMap.getOrDefault("paytm", BigDecimal.ZERO));
        result.put("otherTotal", gatewayMap.entrySet().stream()
                .filter(e -> !e.getKey().equals("upi") && !e.getKey().equals("cash") && !e.getKey().equals("paytm"))
                .map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Object[]> productSales = invoiceRepository.salesByProduct(start, end, companyId);
        List<Map<String, Object>> productList = new ArrayList<>();
        for (Object[] row : productSales) {
            Map<String, Object> product = new HashMap<>();
            product.put("productId", ((Number) row[0]).longValue());
            product.put("productName", row[1]);
            product.put("totalQty", ((Number) row[2]).doubleValue());
            product.put("totalSales", row[3]);
            productList.add(product);
        }
        result.put("productSales", productList);
        result.put("fromDate", fromDate.toString());
        result.put("toDate", toDate.toString());

        return ResponseEntity.ok(result);
    }
}
