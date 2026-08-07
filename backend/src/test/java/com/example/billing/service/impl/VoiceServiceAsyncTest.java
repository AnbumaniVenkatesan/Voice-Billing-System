package com.example.billing.service.impl;

import com.example.billing.config.CurrentUserProvider;
import com.example.billing.dto.request.VoiceRequest;
import com.example.billing.dto.response.VoiceResponse;
import com.example.billing.entity.Product;
import com.example.billing.entity.ProductAlias;
import com.example.billing.repository.ProductAliasRepository;
import com.example.billing.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoiceServiceAsyncTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductAliasRepository productAliasRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private VoiceServiceImpl voiceService;

    private Executor synchronousExecutor;

    @BeforeEach
    void setUp() {
        // Use synchronous executor for predictable unit tests
        synchronousExecutor = Runnable::run;
        when(currentUserProvider.getCompanyId()).thenReturn(1L);

        // Inject the executor via reflection since @Qualifier makes constructor injection tricky
        try {
            var field = VoiceServiceImpl.class.getDeclaredField("voiceBillingExecutor");
            field.setAccessible(true);
            field.set(voiceService, synchronousExecutor);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Product createProduct(Long id, String name, String tamilName, BigDecimal price, BigDecimal gst) {
        return Product.builder()
                .productId(id)
                .productName(name)
                .tamilName(tamilName)
                .price(price)
                .gstPercentage(gst)
                .status("active")
                .build();
    }

    private ProductAlias createAlias(Product product, String aliasName) {
        return ProductAlias.builder()
                .aliasId(1L)
                .product(product)
                .aliasName(aliasName)
                .build();
    }

    // =========================================================================
    // Test: Single product voice command
    // =========================================================================

    @Test
    @DisplayName("Single product — should return 1 matched, 0 unmatched")
    void singleProduct_voiceCommand_returnsMatched() {
        Product rice = createProduct(1L, "Rice", "Arisi", new BigDecimal("85.00"), BigDecimal.ZERO);
        ProductAlias arisiAlias = createAlias(rice, "arisi");

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(List.of(arisiAlias));
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(rice));

        VoiceRequest request = new VoiceRequest();
        request.setText("rendu arisi");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(1);
        assertThat(response.getUnmatchedItems()).isEmpty();

        VoiceResponse.VoiceItem item = response.getMatchedItems().get(0);
        assertThat(item.getProductId()).isEqualTo(1L);
        assertThat(item.getProductName()).isEqualTo("Rice");
        assertThat(item.getQuantity()).isEqualTo(2);
        assertThat(item.getPrice()).isEqualByComparingTo(new BigDecimal("85.00"));
    }

    // =========================================================================
    // Test: Multiple products — all matched
    // =========================================================================

    @Test
    @DisplayName("Multiple products — all matched, returns correct items")
    void multipleProducts_allMatched_returnsAll() {
        Product rice = createProduct(1L, "Rice", "Arisi", new BigDecimal("85.00"), BigDecimal.ZERO);
        Product soap = createProduct(2L, "Soap", "Sabuni", new BigDecimal("35.00"), new BigDecimal("18.00"));

        ProductAlias arisiAlias = createAlias(rice, "arisi");
        ProductAlias soapAlias = createAlias(soap, "soap");

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(List.of(arisiAlias, soapAlias));
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(rice, soap));

        VoiceRequest request = new VoiceRequest();
        request.setText("rendu arisi moonu soap");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(2);
        assertThat(response.getUnmatchedItems()).isEmpty();
    }

    // =========================================================================
    // Test: Mixed — some matched, some unmatched
    // =========================================================================

    @Test
    @DisplayName("Mixed products — matched and unmatched separated correctly")
    void mixedProducts_returnsMatchedAndUnmatched() {
        Product rice = createProduct(1L, "Rice", "Arisi", new BigDecimal("85.00"), BigDecimal.ZERO);
        ProductAlias arisiAlias = createAlias(rice, "arisi");

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(List.of(arisiAlias));
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(rice));

        VoiceRequest request = new VoiceRequest();
        request.setText("rendu arisi naalu biscuit");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(1);
        assertThat(response.getMatchedItems().get(0).getProductName()).isEqualTo("Rice");

        // Unknown words that aren't known product names are not surfaced as unmatched
        assertThat(response.getUnmatchedItems()).isEmpty();
    }

    // =========================================================================
    // Test: All unmatched — no products found
    // =========================================================================

    @Test
    @DisplayName("All unmatched — no products found, returns empty matched")
    void allUnmatched_returnsEmptyMatched() {
        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(Collections.emptyList());
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(Collections.emptyList());

        VoiceRequest request = new VoiceRequest();
        request.setText("naalu biscuit moonu chocolate");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).isEmpty();
        // With no known names, the whole text is parsed as a single unmatched item
        assertThat(response.getUnmatchedItems()).hasSize(1);
    }

    // =========================================================================
    // Test: GST calculation
    // =========================================================================

    @Test
    @DisplayName("GST calculated correctly — 18% on ₹35 soap x 2 = ₹12.60")
    void gstCalculation_correctAmount() {
        Product soap = createProduct(2L, "Soap", "Sabuni", new BigDecimal("35.00"), new BigDecimal("18.00"));
        ProductAlias soapAlias = createAlias(soap, "soap");

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(List.of(soapAlias));
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(soap));

        VoiceRequest request = new VoiceRequest();
        request.setText("rendu soap");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(1);
        VoiceResponse.VoiceItem item = response.getMatchedItems().get(0);
        assertThat(item.getGstPercentage()).isEqualByComparingTo(new BigDecimal("18.00"));
        assertThat(item.getPrice()).isEqualByComparingTo(new BigDecimal("35.00"));
        assertThat(item.getQuantity()).isEqualTo(2);
    }

    // =========================================================================
    // Test: Empty text returns empty response
    // =========================================================================

    @Test
    @DisplayName("Empty text — returns empty matched and unmatched")
    void emptyText_returnsEmptyResponse() {
        VoiceRequest request = new VoiceRequest();
        request.setText("   ");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).isEmpty();
        assertThat(response.getUnmatchedItems()).isEmpty();
    }

    // =========================================================================
    // Test: Name matching fallback (no alias, but product name matches)
    // =========================================================================

    @Test
    @DisplayName("Name fallback — product found by name match when no alias exists")
    void nameFallback_productFoundByName() {
        Product rice = createProduct(1L, "Rice", "Arisi", new BigDecimal("85.00"), BigDecimal.ZERO);

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(Collections.emptyList());
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(rice));

        VoiceRequest request = new VoiceRequest();
        request.setText("rendu rice");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(1);
        assertThat(response.getMatchedItems().get(0).getProductName()).isEqualTo("Rice");
    }

    // =========================================================================
    // Test: Stock validation — product still added even with low stock
    // =========================================================================

    @Test
    @DisplayName("Low stock — product still added (backorder allowed)")
    void lowStock_productStillAdded() {
        Product rice = createProduct(1L, "Rice", "Arisi", new BigDecimal("85.00"), BigDecimal.ZERO);
        ProductAlias arisiAlias = createAlias(rice, "arisi");

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(List.of(arisiAlias));
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(rice));

        VoiceRequest request = new VoiceRequest();
        request.setText("naalu arisi");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(1);
        assertThat(response.getMatchedItems().get(0).getQuantity()).isEqualTo(4);
    }

    // =========================================================================
    // Test: Performance — multiple products complete in reasonable time
    // =========================================================================

    @Test
    @DisplayName("Performance — 10 products processed in < 500ms")
    void performance_tenProducts_fast() {
        List<Product> products = new ArrayList<>();
        List<ProductAlias> aliases = new ArrayList<>();

        for (int i = 1; i <= 10; i++) {
            Product p = createProduct((long) i, "Product" + i, "Tamil" + i,
                    new BigDecimal("10.00"), BigDecimal.ZERO);
            products.add(p);
            aliases.add(createAlias(p, "product" + i));
        }

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(aliases);
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(products);

        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 10; i++) {
            if (i > 1) sb.append(" ");
            sb.append(i).append(" product").append(i);
        }

        VoiceRequest request = new VoiceRequest();
        request.setText(sb.toString());

        long start = System.currentTimeMillis();
        VoiceResponse response = voiceService.processVoiceCommand(request);
        long elapsed = System.currentTimeMillis() - start;

        assertThat(response.getMatchedItems()).hasSize(10);
        assertThat(response.getUnmatchedItems()).isEmpty();
        assertThat(elapsed).isLessThan(500);
    }

    // =========================================================================
    // Test: Exception in one product does not fail others
    // =========================================================================

    @Test
    @DisplayName("Partial failure — one product error does not break others")
    void partialFailure_othersStillProcess() {
        Product rice = createProduct(1L, "Rice", "Arisi", new BigDecimal("85.00"), BigDecimal.ZERO);
        Product soap = createProduct(2L, "Soap", "Sabuni", new BigDecimal("35.00"), BigDecimal.ZERO);

        ProductAlias arisiAlias = createAlias(rice, "arisi");
        ProductAlias soapAlias = createAlias(soap, "soap");

        when(productAliasRepository.findByAliasNamesIn(anyList(), anyLong()))
                .thenReturn(List.of(arisiAlias, soapAlias));
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(List.of(rice, soap));

        VoiceRequest request = new VoiceRequest();
        request.setText("rendu arisi moonu soap");

        VoiceResponse response = voiceService.processVoiceCommand(request);

        assertThat(response.getMatchedItems()).hasSize(2);
    }

    // =========================================================================
    // Test: Quantity normalization — spoken number words → digits (hardcoded)
    // =========================================================================

    private Product createNamedProduct(Long id, String name, String tamilName) {
        return createProduct(id, name, tamilName, new BigDecimal("10.00"), BigDecimal.ZERO);
    }

    private VoiceResponse process(String text, List<Product> products) {
        when(productRepository.findByStatusAndCompanyId(eq("active"), anyLong()))
                .thenReturn(products);
        VoiceRequest request = new VoiceRequest();
        request.setText(text);
        return voiceService.processVoiceCommand(request);
    }

    private double qty(VoiceResponse response) {
        assertThat(response.getMatchedItems()).hasSize(1);
        return response.getMatchedItems().get(0).getQuantity();
    }

    @Test
    @DisplayName("English qty before product — 'three idly' → 3")
    void quantityNormalization_englishBeforeProduct() {
        VoiceResponse response = process("three idly",
                List.of(createNamedProduct(1L, "Idly", "Idly")));
        assertThat(qty(response)).isEqualTo(3);
    }

    @Test
    @DisplayName("English qty after product — 'idly three' → 3")
    void quantityNormalization_englishAfterProduct() {
        VoiceResponse response = process("idly three",
                List.of(createNamedProduct(1L, "Idly", "Idly")));
        assertThat(qty(response)).isEqualTo(3);
    }

    @Test
    @DisplayName("Tanglish qty before product — 'rendu chicken biryani' → 2")
    void quantityNormalization_tanglishBeforeProduct() {
        VoiceResponse response = process("rendu chicken biryani",
                List.of(createNamedProduct(1L, "Chicken Biryani", "Chicken Biryani")));
        assertThat(qty(response)).isEqualTo(2);
    }

    @Test
    @DisplayName("Tamil qty before product — 'மூணு இட்லி' → 3")
    void quantityNormalization_tamilBeforeProduct() {
        VoiceResponse response = process("மூணு இட்லி",
                List.of(createNamedProduct(1L, "Idly", "இட்லி")));
        assertThat(qty(response)).isEqualTo(3);
    }

    @Test
    @DisplayName("Tamil qty after product — 'இட்லி மூணு' → 3")
    void quantityNormalization_tamilAfterProduct() {
        VoiceResponse response = process("இட்லி மூணு",
                List.of(createNamedProduct(1L, "Idly", "இட்லி")));
        assertThat(qty(response)).isEqualTo(3);
    }

    @Test
    @DisplayName("Tamil qty before multi-word Tamil product — 'ரெண்டு சிக்கன் பிரியாணி' → 2")
    void quantityNormalization_tamilMultiWordProduct() {
        VoiceResponse response = process("ரெண்டு சிக்கன் பிரியாணி",
                List.of(createNamedProduct(1L, "Chicken Biryani", "சிக்கன் பிரியாணி")));
        assertThat(qty(response)).isEqualTo(2);
    }

    @Test
    @DisplayName("Multi-word product with leading qty — 'three onion dosa' → 3")
    void quantityNormalization_multiWordEnglishProduct() {
        VoiceResponse response = process("three onion dosa",
                List.of(createNamedProduct(1L, "Onion Dosa", "Onion Dosa")));
        assertThat(qty(response)).isEqualTo(3);
    }

    @Test
    @DisplayName("Simple English qty — 'two coffee' → 2")
    void quantityNormalization_twoCoffee() {
        VoiceResponse response = process("two coffee",
                List.of(createNamedProduct(1L, "Coffee", "Coffee")));
        assertThat(qty(response)).isEqualTo(2);
    }

    @Test
    @DisplayName("Teen number — 'sixteen idly' → 16 (not 6)")
    void quantityNormalization_teenNumber() {
        VoiceResponse response = process("sixteen idly",
                List.of(createNamedProduct(1L, "Idly", "Idly")));
        assertThat(qty(response)).isEqualTo(16);
    }

    @Test
    @DisplayName("'one half boil' — fraction word part of product name → qty 1")
    void quantityNormalization_halfBoilProduct() {
        VoiceResponse response = process("one half boil",
                List.of(createNamedProduct(1L, "Half Boil", "Half Boil")));
        assertThat(qty(response)).isEqualTo(1);
    }

    @Test
    @DisplayName("Multiple products with Tamil quantities — each gets correct qty")
    void quantityNormalization_multipleProducts() {
        List<Product> products = List.of(
                createNamedProduct(1L, "Idly", "இட்லி"),
                createNamedProduct(2L, "Dosa", "தோசை"));
        VoiceResponse response = process("மூணு இட்லி ரெண்டு தோசை", products);
        assertThat(response.getMatchedItems()).hasSize(2);
        assertThat(response.getMatchedItems().get(0).getProductId()).isEqualTo(1L);
        assertThat(response.getMatchedItems().get(0).getQuantity()).isEqualTo(3);
        assertThat(response.getMatchedItems().get(1).getProductId()).isEqualTo(2L);
        assertThat(response.getMatchedItems().get(1).getQuantity()).isEqualTo(2);
    }
}
