package com.example.billing.service;

import com.example.billing.dto.request.ProductRequest;
import com.example.billing.dto.response.ExcelImportResponse;
import com.example.billing.dto.response.ProductResponse;
import com.example.billing.dto.response.StockUpdateResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Long id);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void deleteProduct(Long id);

    List<ProductResponse> searchProducts(String keyword);

    ExcelImportResponse importFromExcel(MultipartFile file);

    StockUpdateResponse updateStockFromExcel(MultipartFile file);

    List<String> getAliases(Long productId);

    List<String> addAlias(Long productId, String aliasName);

    void deleteAlias(Long aliasId);

    void selfLearn(String spokenText, Long productId);
}
