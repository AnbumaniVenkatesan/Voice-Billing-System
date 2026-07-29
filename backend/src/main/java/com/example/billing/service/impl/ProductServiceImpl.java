package com.example.billing.service.impl;

import com.example.billing.dto.request.ProductRequest;
import com.example.billing.dto.response.ExcelImportResponse;
import com.example.billing.dto.response.ProductResponse;
import com.example.billing.dto.response.StockUpdateResponse;
import com.example.billing.entity.Product;
import com.example.billing.entity.ProductAlias;
import com.example.billing.exception.ResourceNotFoundException;
import com.example.billing.repository.ProductAliasRepository;
import com.example.billing.repository.ProductRepository;
import com.example.billing.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductAliasRepository productAliasRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product;

        if (request.getProductId() != null) {
            jdbcTemplate.update(
                "INSERT INTO product (product_id, product_name, tamil_name, price, gst_percentage, stock, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                request.getProductId(), request.getProductName(), request.getTamilName(),
                request.getPrice(), request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO,
                request.getStock(), request.getStatus() != null ? request.getStatus() : "active");
            product = productRepository.findById(request.getProductId()).orElseThrow();
        } else {
            product = Product.builder()
                    .productName(request.getProductName())
                    .tamilName(request.getTamilName())
                    .price(request.getPrice())
                    .gstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO)
                    .stock(request.getStock())
                    .status(request.getStatus() != null ? request.getStatus() : "active")
                    .aliases(new ArrayList<>())
                    .build();
            product = productRepository.save(product);
        }

        Product saved = product;

        if (request.getAliases() != null && !request.getAliases().isEmpty()) {
            java.util.Set<String> seen = new java.util.HashSet<>();
            seen.add(request.getProductName().trim().toLowerCase());
            for (String aliasName : request.getAliases()) {
                String trimmed = aliasName.trim();
                if (trimmed.isEmpty() || !seen.add(trimmed.toLowerCase())) continue;
                ProductAlias alias = ProductAlias.builder()
                        .product(saved)
                        .aliasName(trimmed)
                        .build();
                productAliasRepository.save(alias);
                saved.getAliases().add(alias);
            }
        }

        if (request.getTamilName() != null && !request.getTamilName().isBlank()) {
            String tn = request.getTamilName().trim().toLowerCase();
            String pn = request.getProductName().trim().toLowerCase();
            boolean exists = tn.equals(pn) || saved.getAliases().stream()
                    .anyMatch(a -> a.getAliasName().equalsIgnoreCase(tn));
            if (!exists) {
                ProductAlias alias = ProductAlias.builder()
                        .product(saved)
                        .aliasName(request.getTamilName().trim())
                        .build();
                productAliasRepository.save(alias);
                saved.getAliases().add(alias);
            }
        }

        return mapToResponse(saved);
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        product.setProductName(request.getProductName());
        product.setTamilName(request.getTamilName());
        product.setPrice(request.getPrice());
        product.setGstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : java.math.BigDecimal.ZERO);
        product.setStock(request.getStock());
        product.setStatus(request.getStatus() != null ? request.getStatus() : "active");

        product.getAliases().clear();

        Product updated = productRepository.save(product);

        if (request.getAliases() != null) {
            java.util.Set<String> seen = new java.util.HashSet<>();
            seen.add(updated.getProductName().trim().toLowerCase());
            for (String aliasName : request.getAliases()) {
                String trimmed = aliasName.trim();
                if (trimmed.isEmpty() || !seen.add(trimmed.toLowerCase())) continue;
                ProductAlias alias = ProductAlias.builder()
                        .product(updated)
                        .aliasName(trimmed)
                        .build();
                productAliasRepository.save(alias);
                updated.getAliases().add(alias);
            }
        }

        if (updated.getTamilName() != null && !updated.getTamilName().isBlank()) {
            String tn = updated.getTamilName().trim().toLowerCase();
            String pn = updated.getProductName().trim().toLowerCase();
            boolean exists = tn.equals(pn) || updated.getAliases().stream()
                    .anyMatch(a -> a.getAliasName().equalsIgnoreCase(tn));
            if (!exists) {
                ProductAlias alias = ProductAlias.builder()
                        .product(updated)
                        .aliasName(updated.getTamilName().trim())
                        .build();
                productAliasRepository.save(alias);
                updated.getAliases().add(alias);
            }
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", "id", id);
        }
        productRepository.deleteById(id);
    }

    @Override
    public List<ProductResponse> searchProducts(String keyword) {
        return productRepository.searchByKeyword(keyword).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExcelImportResponse importFromExcel(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        List<String> importedProducts = new ArrayList<>();
        int totalRows = 0;
        int totalAliases = 0;
        int duplicatesSkipped = 0;

        Set<String> existingNames = productRepository.findAll().stream()
                .map(p -> p.getProductName().trim().toLowerCase())
                .collect(Collectors.toSet());
        Set<String> existingAliases = productAliasRepository.findAll().stream()
                .map(a -> a.getAliasName().trim().toLowerCase())
                .collect(Collectors.toSet());

        Set<String> fileNames = new HashSet<>();
        Set<String> fileAliases = new HashSet<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            Map<String, Integer> colMap = new HashMap<>();
            if (rowIterator.hasNext()) {
                Row headerRow = rowIterator.next();
                for (int i = 0; i <= headerRow.getLastCellNum(); i++) {
                    Cell cell = headerRow.getCell(i);
                    String header = getCellStringValue(cell);
                    if (header != null) {
                        colMap.put(header.trim().toLowerCase().replaceAll("[\\s_]+", ""), i);
                    }
                }
            }

            int colId      = colMap.getOrDefault("productid", colMap.getOrDefault("id", -1));
            int colName    = colMap.getOrDefault("productname", colMap.getOrDefault("name", -1));
            int colTamil   = colMap.getOrDefault("tamilname", colMap.getOrDefault("tamil", -1));
            int colPrice   = colMap.getOrDefault("price", -1);
            int colGst     = colMap.getOrDefault("gst%", colMap.getOrDefault("gst", -1));
            int colStock   = colMap.getOrDefault("stock", -1);
            int colStatus  = colMap.getOrDefault("status", -1);

            List<Integer> aliasCols = new ArrayList<>();
            for (int i = 1; i <= 20; i++) {
                String[] keys = {"alias" + i, "alias" + i};
                for (String key : keys) {
                    Integer idx = colMap.get(key);
                    if (idx != null) {
                        aliasCols.add(idx);
                        break;
                    }
                }
            }
            Integer legacyAliasCol = colMap.get("aliases");
            if (legacyAliasCol != null) {
                aliasCols.add(legacyAliasCol);
            }

            if (colName == -1) {
                errors.add("Excel must have a 'Product Name' or 'Name' column");
                return ExcelImportResponse.builder().totalRows(0).successCount(0)
                        .errorCount(1).errors(errors).importedProducts(importedProducts)
                        .aliasesImported(0).duplicatesSkipped(0).build();
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                totalRows++;

                Long productId = null;
                if (colId >= 0) {
                    String idStr = getCellStringValue(row.getCell(colId));
                    if (idStr != null && !idStr.trim().isEmpty()) {
                        try { productId = Long.parseLong(idStr.trim()); } catch (NumberFormatException ignored) {}
                    }
                }
                String productName = getCellStringValue(colName >= 0 ? row.getCell(colName) : null);
                String tamilName   = getCellStringValue(colTamil >= 0 ? row.getCell(colTamil) : null);
                String priceStr    = getCellStringValue(colPrice >= 0 ? row.getCell(colPrice) : null);
                String gstStr      = getCellStringValue(colGst >= 0 ? row.getCell(colGst) : null);
                String stockStr    = getCellStringValue(colStock >= 0 ? row.getCell(colStock) : null);
                String status      = getCellStringValue(colStatus >= 0 ? row.getCell(colStatus) : null);

                if (productName == null || productName.trim().isEmpty()) {
                    errors.add("Row " + (totalRows + 1) + ": Product name is required");
                    continue;
                }
                productName = productName.trim();

                if (priceStr == null || priceStr.trim().isEmpty()) {
                    errors.add("Row " + (totalRows + 1) + " (" + productName + "): Price is required");
                    continue;
                }

                BigDecimal price;
                try {
                    price = new BigDecimal(priceStr.trim());
                    if (price.compareTo(BigDecimal.ZERO) <= 0) {
                        errors.add("Row " + (totalRows + 1) + " (" + productName + "): Price must be > 0");
                        continue;
                    }
                } catch (NumberFormatException e) {
                    errors.add("Row " + (totalRows + 1) + " (" + productName + "): Invalid price '" + priceStr + "'");
                    continue;
                }

                int stock;
                try {
                    stock = stockStr != null && !stockStr.trim().isEmpty()
                            ? Integer.parseInt(stockStr.trim()) : 0;
                } catch (NumberFormatException e) {
                    errors.add("Row " + (totalRows + 1) + " (" + productName + "): Invalid stock '" + stockStr + "'");
                    continue;
                }

                BigDecimal gstPercentage = BigDecimal.ZERO;
                if (gstStr != null && !gstStr.trim().isEmpty()) {
                    try {
                        gstPercentage = new BigDecimal(gstStr.trim());
                    } catch (NumberFormatException e) {
                        errors.add("Row " + (totalRows + 1) + " (" + productName + "): Invalid GST '" + gstStr + "'");
                        continue;
                    }
                }

                String normalizedName = productName.toLowerCase();
                if (existingNames.contains(normalizedName) || !fileNames.add(normalizedName)) {
                    errors.add("Row " + (totalRows + 1) + ": Duplicate product name '" + productName + "'");
                    continue;
                }

                List<String> aliasList = new ArrayList<>();
                int rowAliasCount = 0;
                int rowDupSkipped = 0;

                if (tamilName != null && !tamilName.trim().isEmpty()) {
                    String tnLower = tamilName.trim().toLowerCase();
                    if (!tnLower.equals(normalizedName)) {
                        aliasList.add(tamilName.trim());
                    }
                }

                for (int colIdx : aliasCols) {
                    String aliasCell = getCellStringValue(row.getCell(colIdx));
                    if (aliasCell == null || aliasCell.trim().isEmpty()) continue;
                    String[] parts = aliasCell.split(",");
                    for (String part : parts) {
                        String trimmed = part.trim();
                        if (trimmed.isEmpty()) continue;
                        String normalizedAlias = trimmed.toLowerCase();
                        if (normalizedAlias.equals(normalizedName)) continue;
                        boolean alreadyInRow = false;
                        for (String a : aliasList) {
                            if (a.trim().toLowerCase().equals(normalizedAlias)) {
                                alreadyInRow = true;
                                break;
                            }
                        }
                        if (alreadyInRow) {
                            rowDupSkipped++;
                            duplicatesSkipped++;
                            continue;
                        }
                        if (existingAliases.contains(normalizedAlias) || fileAliases.contains(normalizedAlias)) {
                            rowDupSkipped++;
                            duplicatesSkipped++;
                            continue;
                        }
                        aliasList.add(trimmed);
                        fileAliases.add(normalizedAlias);
                        rowAliasCount++;
                    }
                }

                totalAliases += rowAliasCount;
                duplicatesSkipped += rowDupSkipped;

                String finalStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : "active";

                try {
                    saveProductWithAliases(productId, productName, tamilName != null ? tamilName.trim() : null,
                            price, gstPercentage, stock, finalStatus, aliasList);
                } catch (Exception e) {
                    errors.add("Row " + (totalRows + 1) + " (" + productName + "): Save failed - " + e.getMessage());
                    continue;
                }

                existingNames.add(normalizedName);
                importedProducts.add(productName);
            }

        } catch (Exception e) {
            errors.add("Failed to read Excel file: " + e.getMessage());
        }

        return ExcelImportResponse.builder()
                .totalRows(totalRows)
                .successCount(importedProducts.size())
                .errorCount(errors.size())
                .aliasesImported(totalAliases)
                .duplicatesSkipped(duplicatesSkipped)
                .errors(errors)
                .importedProducts(importedProducts)
                .build();
    }

    @Transactional
    public void saveProductWithAliases(Long productId, String productName, String tamilName,
                                       java.math.BigDecimal price, java.math.BigDecimal gstPercentage,
                                       int stock, String status, List<String> aliasList) {
        Product saved;
        if (productId != null) {
            jdbcTemplate.update(
                "INSERT INTO product (product_id, product_name, tamil_name, price, gst_percentage, stock, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                productId, productName, tamilName, price, gstPercentage, stock, status);
            saved = productRepository.findById(productId).orElseThrow();
        } else {
            Product product = Product.builder()
                    .productName(productName)
                    .tamilName(tamilName)
                    .price(price)
                    .gstPercentage(gstPercentage)
                    .stock(stock)
                    .status(status)
                    .aliases(new ArrayList<>())
                    .build();
            saved = productRepository.save(product);
        }

        java.util.Set<String> addedAliases = new java.util.HashSet<>();
        addedAliases.add(productName.toLowerCase());

        for (String aliasName : aliasList) {
            String lower = aliasName.trim().toLowerCase();
            if (addedAliases.contains(lower)) continue;
            addedAliases.add(lower);
            ProductAlias alias = ProductAlias.builder()
                    .product(saved)
                    .aliasName(aliasName.trim())
                    .build();
            productAliasRepository.save(alias);
            saved.getAliases().add(alias);
        }

        if (tamilName != null && !tamilName.isBlank()) {
            String lower = tamilName.trim().toLowerCase();
            if (!addedAliases.contains(lower)) {
                addedAliases.add(lower);
                ProductAlias alias = ProductAlias.builder()
                        .product(saved)
                        .aliasName(tamilName.trim())
                        .build();
                productAliasRepository.save(alias);
                saved.getAliases().add(alias);
            }
        }
    }

    @Override
    public StockUpdateResponse updateStockFromExcel(MultipartFile file) {
        List<String> updated = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        List<String> notFound = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int totalRows = 0;

        Map<String, Product> productByName = productRepository.findAll().stream()
                .collect(Collectors.toMap(p -> p.getProductName().trim().toLowerCase(), p -> p, (a, b) -> a));

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            Map<String, Integer> colMap = new HashMap<>();
            if (rowIterator.hasNext()) {
                Row headerRow = rowIterator.next();
                for (int i = 0; i <= headerRow.getLastCellNum(); i++) {
                    Cell cell = headerRow.getCell(i);
                    String header = getCellStringValue(cell);
                    if (header != null) {
                        colMap.put(header.trim().toLowerCase().replaceAll("[\\s_]+", ""), i);
                    }
                }
            }

            int colName = colMap.getOrDefault("productname", colMap.getOrDefault("name", -1));
            int colStock = colMap.getOrDefault("stock", -1);
            int colPrice = colMap.getOrDefault("price", -1);

            if (colName == -1) {
                errors.add("Excel must have a 'Name' or 'Product Name' column");
                return StockUpdateResponse.builder().totalRows(0).updatedCount(0)
                        .skippedCount(0).notFoundCount(0).updated(updated)
                        .skipped(skipped).notFound(notFound).errors(errors).build();
            }

            boolean hasStock = colStock >= 0;
            boolean hasPrice = colPrice >= 0;

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                totalRows++;

                String productName = getCellStringValue(colName >= 0 ? row.getCell(colName) : null);
                String stockStr = hasStock ? getCellStringValue(row.getCell(colStock)) : null;
                String priceStr = hasPrice ? getCellStringValue(row.getCell(colPrice)) : null;

                if (productName == null || productName.trim().isEmpty()) {
                    skipped.add("Row " + (totalRows + 1) + ": Empty product name");
                    continue;
                }

                String key = productName.trim().toLowerCase();
                Product product = productByName.get(key);

                if (product == null) {
                    notFound.add(productName.trim());
                    continue;
                }

                boolean hasStockVal = stockStr != null && !stockStr.trim().isEmpty();
                boolean hasPriceVal = priceStr != null && !priceStr.trim().isEmpty();

                if (!hasStockVal && !hasPriceVal) {
                    skipped.add(productName.trim() + " (no stock or price to update)");
                    continue;
                }

                StringBuilder msg = new StringBuilder(productName.trim());

                if (hasStockVal) {
                    int addStock;
                    try {
                        addStock = Integer.parseInt(stockStr.trim());
                    } catch (NumberFormatException e) {
                        errors.add("Row " + (totalRows + 1) + " (" + productName + "): Invalid stock '" + stockStr + "'");
                        continue;
                    }
                    if (addStock <= 0) {
                        skipped.add(productName.trim() + " (stock <= 0, skipped)");
                        continue;
                    }
                    int oldStock = product.getStock();
                    product.setStock(oldStock + addStock);
                    msg.append(" stock: ").append(oldStock).append("→").append(product.getStock());
                }

                if (hasPriceVal) {
                    java.math.BigDecimal newPrice;
                    try {
                        newPrice = new java.math.BigDecimal(priceStr.trim());
                    } catch (NumberFormatException e) {
                        errors.add("Row " + (totalRows + 1) + " (" + productName + "): Invalid price '" + priceStr + "'");
                        continue;
                    }
                    if (newPrice.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                        skipped.add(productName.trim() + " (price <= 0, skipped)");
                        continue;
                    }
                    msg.append(" price: ₹").append(product.getPrice()).append("→₹").append(newPrice);
                    product.setPrice(newPrice);
                }

                productRepository.save(product);
                updated.add(msg.toString());
            }

        } catch (Exception e) {
            errors.add("Failed to read Excel file: " + e.getMessage());
        }

        return StockUpdateResponse.builder()
                .totalRows(totalRows)
                .updatedCount(updated.size())
                .skippedCount(skipped.size())
                .notFoundCount(notFound.size())
                .updated(updated)
                .skipped(skipped)
                .notFound(notFound)
                .errors(errors)
                .build();
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) {
                    return String.valueOf((long) numVal);
                }
                return String.valueOf(numVal);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        return String.valueOf(cell.getNumericCellValue());
                    } catch (Exception e2) {
                        return null;
                    }
                }
            default:
                return null;
        }
    }

    @Override
    public List<String> getAliases(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return productAliasRepository.findAllByProductId(productId).stream()
                .map(ProductAlias::getAliasName)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<String> addAlias(Long productId, String aliasName) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        String normalized = aliasName.trim().toLowerCase();
        if (normalized.isEmpty()) {
            throw new RuntimeException("Alias cannot be empty");
        }
        if (normalized.equals(product.getProductName().trim().toLowerCase())) {
            throw new RuntimeException("Alias is the same as the product name");
        }
        boolean exists = productAliasRepository.findAllByProductId(productId).stream()
                .anyMatch(a -> a.getAliasName().trim().toLowerCase().equals(normalized));
        if (exists) {
            throw new RuntimeException("Alias already exists for this product");
        }
        ProductAlias alias = ProductAlias.builder()
                .product(product)
                .aliasName(aliasName.trim())
                .build();
        productAliasRepository.save(alias);
        return getAliases(productId);
    }

    @Override
    @Transactional
    public void deleteAlias(Long aliasId) {
        ProductAlias alias = productAliasRepository.findById(aliasId)
                .orElseThrow(() -> new ResourceNotFoundException("Alias", "id", aliasId));
        productAliasRepository.deleteById(aliasId);
    }

    @Override
    @Transactional
    public void selfLearn(String spokenText, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        String normalized = spokenText.trim().toLowerCase();
        if (normalized.isEmpty()) return;
        if (normalized.equals(product.getProductName().trim().toLowerCase())) return;
        boolean exists = productAliasRepository.findByAliasNameIgnoreCase(normalized).stream()
                .anyMatch(a -> a.getProduct().getProductId().equals(productId));
        if (!exists) {
            ProductAlias alias = ProductAlias.builder()
                    .product(product)
                    .aliasName(spokenText.trim())
                    .language("LEARNED")
                    .build();
            productAliasRepository.save(alias);
        }
    }

    private ProductResponse mapToResponse(Product product) {
        List<String> aliasNames = product.getAliases() != null
                ? product.getAliases().stream()
                    .map(ProductAlias::getAliasName)
                    .collect(Collectors.toList())
                : new ArrayList<>();

        return ProductResponse.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .tamilName(product.getTamilName())
                .price(product.getPrice())
                .gstPercentage(product.getGstPercentage())
                .stock(product.getStock())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .aliases(aliasNames)
                .build();
    }
}
