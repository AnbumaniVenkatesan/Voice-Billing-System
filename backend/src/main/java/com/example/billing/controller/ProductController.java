package com.example.billing.controller;

import com.example.billing.dto.request.ProductRequest;
import com.example.billing.dto.response.ExcelImportResponse;
import com.example.billing.dto.response.ProductResponse;
import com.example.billing.dto.response.StockUpdateResponse;
import com.example.billing.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(@RequestParam String keyword) {
        List<ProductResponse> products = productService.searchProducts(keyword);
        return ResponseEntity.ok(products);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] data = productService.exportToExcel();
        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=products.xlsx")
                .body(data);
    }

    @PostMapping("/import-excel")
    public ResponseEntity<ExcelImportResponse> importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !(filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest().build();
        }
        ExcelImportResponse response = productService.importFromExcel(file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stock-excel")
    public ResponseEntity<StockUpdateResponse> importStock(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !(filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest().build();
        }
        StockUpdateResponse response = productService.updateStockFromExcel(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/aliases")
    public ResponseEntity<List<String>> getAliases(@PathVariable Long id) {
        List<String> aliases = productService.getAliases(id);
        return ResponseEntity.ok(aliases);
    }

    @PostMapping("/{id}/aliases")
    public ResponseEntity<List<String>> addAlias(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String alias = body.get("alias");
        if (alias == null || alias.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        List<String> aliases = productService.addAlias(id, alias);
        return ResponseEntity.ok(aliases);
    }

    @DeleteMapping("/aliases/{aliasId}")
    public ResponseEntity<Void> deleteAlias(@PathVariable Long aliasId) {
        productService.deleteAlias(aliasId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/self-learn")
    public ResponseEntity<Void> selfLearn(@RequestBody Map<String, Object> body) {
        String spokenText = (String) body.get("spokenText");
        Long productId = body.get("productId") != null ? ((Number) body.get("productId")).longValue() : null;
        if (spokenText == null || spokenText.isBlank() || productId == null) {
            return ResponseEntity.badRequest().build();
        }
        productService.selfLearn(spokenText, productId);
        return ResponseEntity.ok().build();
    }
}
