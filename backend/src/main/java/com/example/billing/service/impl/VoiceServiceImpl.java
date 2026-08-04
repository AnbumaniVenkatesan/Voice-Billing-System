package com.example.billing.service.impl;

import com.example.billing.config.CurrentUserProvider;
import com.example.billing.dto.request.VoiceRequest;
import com.example.billing.dto.response.VoiceResponse;
import com.example.billing.entity.Product;
import com.example.billing.entity.ProductAlias;
import com.example.billing.repository.ProductAliasRepository;
import com.example.billing.repository.ProductRepository;
import com.example.billing.service.VoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceServiceImpl implements VoiceService {

    private final ProductRepository productRepository;
    private final ProductAliasRepository productAliasRepository;
    private final CurrentUserProvider currentUserProvider;

    @Qualifier("voiceBillingExecutor")
    private final Executor voiceBillingExecutor;

    private static final Map<String, String> TAMIL_NUMBER_MAP = new LinkedHashMap<>();
    private static final Map<String, Integer> ENGLISH_NUMBER_MAP = new LinkedHashMap<>();

    static {
        TAMIL_NUMBER_MAP.put("ஒன்று", "1");
        TAMIL_NUMBER_MAP.put("ஒரு", "1");
        TAMIL_NUMBER_MAP.put("ஒன்", "1");
        TAMIL_NUMBER_MAP.put("ஒன்னு", "1");
        TAMIL_NUMBER_MAP.put("oru", "1");
        TAMIL_NUMBER_MAP.put("இரண்டு", "2");
        TAMIL_NUMBER_MAP.put("ரெண்டு", "2");
        TAMIL_NUMBER_MAP.put("மூன்று", "3");
        TAMIL_NUMBER_MAP.put("முன்னூறு", "300");
        TAMIL_NUMBER_MAP.put("நான்கு", "4");
        TAMIL_NUMBER_MAP.put("நாலு", "4");
        TAMIL_NUMBER_MAP.put("ஐந்து", "5");
        TAMIL_NUMBER_MAP.put("அஞ்சு", "5");
        TAMIL_NUMBER_MAP.put("ஆறு", "6");
        TAMIL_NUMBER_MAP.put("ஏழு", "7");
        TAMIL_NUMBER_MAP.put("எட்டு", "8");
        TAMIL_NUMBER_MAP.put("ஒன்பது", "9");
        TAMIL_NUMBER_MAP.put("பத்து", "10");
        TAMIL_NUMBER_MAP.put("இருபது", "20");
        TAMIL_NUMBER_MAP.put("முப்பது", "30");
        TAMIL_NUMBER_MAP.put("நாற்பது", "40");
        TAMIL_NUMBER_MAP.put("ஐம்பது", "50");

        TAMIL_NUMBER_MAP.put("rendu", "2");
        TAMIL_NUMBER_MAP.put("moonu", "3");
        TAMIL_NUMBER_MAP.put("naalu", "4");
        TAMIL_NUMBER_MAP.put("anju", "5");
        TAMIL_NUMBER_MAP.put("aaru", "6");
        TAMIL_NUMBER_MAP.put("ezhu", "7");
        TAMIL_NUMBER_MAP.put("ettu", "8");
        TAMIL_NUMBER_MAP.put("onbadhu", "9");
        TAMIL_NUMBER_MAP.put("pattu", "10");
        TAMIL_NUMBER_MAP.put("iruvadhu", "20");
        TAMIL_NUMBER_MAP.put("muppadhu", "30");

        // Tamil script phonetic transliterations of English numbers
        // (produced by ta-IN speech recognition when user speaks English numbers)
        TAMIL_NUMBER_MAP.put("ஒன்", "1");
        TAMIL_NUMBER_MAP.put("டூ", "2");
        TAMIL_NUMBER_MAP.put("த்ரீ", "3");
        TAMIL_NUMBER_MAP.put("ஃபோர்", "4");
        TAMIL_NUMBER_MAP.put("பைவ்", "5");
        TAMIL_NUMBER_MAP.put("சிக்ஸ்", "6");
        TAMIL_NUMBER_MAP.put("செவன்", "7");
        TAMIL_NUMBER_MAP.put("எயிட்", "8");
        TAMIL_NUMBER_MAP.put("நைன்", "9");
        TAMIL_NUMBER_MAP.put("டென்", "10");
        TAMIL_NUMBER_MAP.put("டெண்ட்", "10");
        TAMIL_NUMBER_MAP.put("ட்வென்டி", "20");
        TAMIL_NUMBER_MAP.put("தர்ட்டி", "30");

        // Additional colloquial Tamil / Tanglish forms
        TAMIL_NUMBER_MAP.put("ஒண்ணு", "1");
        TAMIL_NUMBER_MAP.put("மூணு", "3");
        TAMIL_NUMBER_MAP.put("onu", "1");
        TAMIL_NUMBER_MAP.put("onnu", "1");
        TAMIL_NUMBER_MAP.put("pathu", "10");

        // English number words (one..twenty) — recognized for all companies
        TAMIL_NUMBER_MAP.put("one", "1");
        TAMIL_NUMBER_MAP.put("two", "2");
        TAMIL_NUMBER_MAP.put("three", "3");
        TAMIL_NUMBER_MAP.put("four", "4");
        TAMIL_NUMBER_MAP.put("five", "5");
        TAMIL_NUMBER_MAP.put("six", "6");
        TAMIL_NUMBER_MAP.put("seven", "7");
        TAMIL_NUMBER_MAP.put("eight", "8");
        TAMIL_NUMBER_MAP.put("nine", "9");
        TAMIL_NUMBER_MAP.put("ten", "10");
        TAMIL_NUMBER_MAP.put("eleven", "11");
        TAMIL_NUMBER_MAP.put("twelve", "12");
        TAMIL_NUMBER_MAP.put("thirteen", "13");
        TAMIL_NUMBER_MAP.put("fourteen", "14");
        TAMIL_NUMBER_MAP.put("fifteen", "15");
        TAMIL_NUMBER_MAP.put("sixteen", "16");
        TAMIL_NUMBER_MAP.put("seventeen", "17");
        TAMIL_NUMBER_MAP.put("eighteen", "18");
        TAMIL_NUMBER_MAP.put("nineteen", "19");
        TAMIL_NUMBER_MAP.put("twenty", "20");

        // English number words (digits 1-10, 20-50) — separate fallback map
        ENGLISH_NUMBER_MAP.put("one", 1);
        ENGLISH_NUMBER_MAP.put("two", 2);
        ENGLISH_NUMBER_MAP.put("three", 3);
        ENGLISH_NUMBER_MAP.put("four", 4);
        ENGLISH_NUMBER_MAP.put("five", 5);
        ENGLISH_NUMBER_MAP.put("six", 6);
        ENGLISH_NUMBER_MAP.put("seven", 7);
        ENGLISH_NUMBER_MAP.put("eight", 8);
        ENGLISH_NUMBER_MAP.put("nine", 9);
        ENGLISH_NUMBER_MAP.put("ten", 10);
        ENGLISH_NUMBER_MAP.put("twenty", 20);
        ENGLISH_NUMBER_MAP.put("thirty", 30);
        ENGLISH_NUMBER_MAP.put("forty", 40);
        ENGLISH_NUMBER_MAP.put("fifty", 50);
    }

    // All spoken number words (English, Tamil, Tanglish) sorted by length DESCENDING
    // so longest words (e.g. "eighteen") are matched before their prefixes ("eight").
    private static final List<Map.Entry<String, String>> NUMBER_WORD_ENTRIES;

    static {
        NUMBER_WORD_ENTRIES = new ArrayList<>(TAMIL_NUMBER_MAP.entrySet());
        NUMBER_WORD_ENTRIES.sort(
                (a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()));
    }

    private static final Map<String, String> UNIT_PATTERNS = new LinkedHashMap<>();
    static {
        // Longer units first to avoid partial matches (e.g. "kilogram" before "gram", "ml" before "l")
        UNIT_PATTERNS.put("\\bkilogram(?:me)?s?\\b", "kg");
        UNIT_PATTERNS.put("\\bkilos?\\b", "kg");
        UNIT_PATTERNS.put("\\bkg\\b", "kg");
        UNIT_PATTERNS.put("\\bகிலோகிராம்\\b", "kg");
        UNIT_PATTERNS.put("\\bகிலோ\\b", "kg");
        UNIT_PATTERNS.put("\\bகேஜ்\\b", "kg");
        UNIT_PATTERNS.put("\\bgrams?\\b", "g");
        UNIT_PATTERNS.put("\\bgram\\b", "g");
        UNIT_PATTERNS.put("\\bகிராம்\\b", "g");
        UNIT_PATTERNS.put("\\bg\\b", "g");
        UNIT_PATTERNS.put("(?<=\\d)g\\b", "g");
        UNIT_PATTERNS.put("\\bmilliliter(?:s)?\\b", "ml");
        UNIT_PATTERNS.put("\\bml\\b", "ml");
        UNIT_PATTERNS.put("\\bமில்லி\\b", "ml");
        UNIT_PATTERNS.put("\\blit(?:re|er)s?\\b", "l");
        UNIT_PATTERNS.put("\\bl\\b", "l");
        UNIT_PATTERNS.put("\\bலிட்டர்\\b", "l");
        UNIT_PATTERNS.put("\\bdozen\\b", "dozen");
        UNIT_PATTERNS.put("\\bடஜன்\\b", "dozen");
        UNIT_PATTERNS.put("\\bpack(?:et)?s?\\b", "packet");
        UNIT_PATTERNS.put("\\bபாக்கெட்\\b", "packet");
    }

    // =========================================================================
    // Product name and alias lookup is now fully DB-driven via product_aliases table.
    // No hardcoded translation maps needed.
    // =========================================================================

    // =========================================================================
    // STEP 0a: Normalize Tamil Unicode text (handle variant encodings)
    // =========================================================================

    private String normalizeTamil(String text) {
        if (text == null || text.isBlank()) return text;

        String normalized = Normalizer.normalize(text, Normalizer.Form.NFC);

        // Strip ஃ (aytham, U+0B83) — speech engine often inserts this spuriously
        normalized = normalized.replace("\u0B83", "");

        return normalized.trim();
    }

    // =========================================================================
    // STEP 0b: Translate Tamil/Tanglish text to English before product lookup
    // Uses ONLY DB-based lookup map (aliases imported from Excel + self-learned)
    // =========================================================================

    private String translateToEnglish(String text, Map<String, Product> dbLookup) {
        if (text == null || text.isBlank()) return text;

        String normalized = normalizeTamil(text);
        String[] words = normalized.split("\\s+");
        StringBuilder translated = new StringBuilder();

        for (String word : words) {
            String lower = word.toLowerCase();

            String english = null;

            // Step 1: Direct DB lookup (product name, tamil name, alias)
            Product p = dbLookup.get(lower);
            if (p != null) {
                english = p.getProductName().toLowerCase();
                log.info("[Voice]   Translate \"{}\" → \"{}\" (DB lookup)", word, english);
            }

            // Step 2: Fallback — strip Tamil vowel signs and match base consonants
            if (english == null) {
                String base = lower.replaceAll("[\\u0BC0-\\u0BCF\\u0BD7\\u0BCD]", "");
                for (Map.Entry<String, Product> entry : dbLookup.entrySet()) {
                    String keyBase = entry.getKey().replaceAll("[\\u0BC0-\\u0BCF\\u0BD7\\u0BCD]", "");
                    if (keyBase.equals(base) && !keyBase.equals(lower)) {
                        english = entry.getValue().getProductName().toLowerCase();
                        log.info("[Voice]   Translate \"{}\" → \"{}\" (vowel-strip DB)", word, english);
                        break;
                    }
                }
            }

            if (english == null) {
                english = word;
            }

            translated.append(english).append(" ");
        }

        String result = translated.toString().trim();
        if (!result.equalsIgnoreCase(text)) {
            log.info("[Voice] Translated: \"{}\" → \"{}\"", text, result);
        }
        return result;
    }

    // =========================================================================
    // STEP 1: Main entry point — fetch DB FIRST → translate → parse → process
    // =========================================================================

    @Override
    public VoiceResponse processVoiceCommand(VoiceRequest request) {
        long totalStart = System.currentTimeMillis();
        String originalText = request.getText().trim();
        Long cid = currentUserProvider.getCompanyId();

        log.info("[Voice] ════════════════════════════════════════════");
        log.info("[Voice] Received Text  : \"{}\"", request.getText());
        log.info("[Voice] ════════════════════════════════════════════");

        // STEP 1: Fetch ALL active products + aliases FIRST (needed for translation)
        long dbStart = System.currentTimeMillis();
        List<Product> allActiveProducts = productRepository.findByStatusAndCompanyId("active", cid);

        Map<String, Product> dbLookup = new LinkedHashMap<>();
        for (Product p : allActiveProducts) {
            if (p.getProductName() != null) {
                dbLookup.put(p.getProductName().toLowerCase(), p);
            }
            if (p.getTamilName() != null && !p.getTamilName().isBlank()) {
                dbLookup.put(p.getTamilName().toLowerCase(), p);
            }
        }

        List<ProductAlias> allAliases = productAliasRepository.findByCompanyId(cid);
        for (ProductAlias pa : allAliases) {
            if (pa.getAliasName() != null && pa.getProduct() != null
                    && "active".equals(pa.getProduct().getStatus())) {
                dbLookup.putIfAbsent(pa.getAliasName().toLowerCase(), pa.getProduct());
            }
        }
        long dbTime = System.currentTimeMillis() - dbStart;
        log.info("[Voice] DB loaded: {} products, {} aliases, {} lookup keys ({}ms)",
                allActiveProducts.size(), allAliases.size(), dbLookup.size(), dbTime);
        log.info("[Voice] DB lookup keys: {}", dbLookup.keySet());

        // STEP 2: Translate Tamil/Tanglish → English using static + DB maps
        String text = translateToEnglish(originalText.toLowerCase(), dbLookup);
        log.info("[Voice] Translated     : \"{}\"", text);

        // STEP 3: Parse voice text into structured items — product-first approach
        // NOTE: Only use DB product names, Tamil names, and aliases.
        long parseStart = System.currentTimeMillis();
        Set<String> knownNames = new HashSet<>();
        for (Product p : allActiveProducts) {
            if (p.getProductName() != null) knownNames.add(p.getProductName().toLowerCase());
            if (p.getTamilName() != null && !p.getTamilName().isBlank()) knownNames.add(p.getTamilName().toLowerCase());
        }
        for (ProductAlias pa : allAliases) {
            if (pa.getAliasName() != null && pa.getProduct() != null
                    && "active".equals(pa.getProduct().getStatus())) {
                knownNames.add(pa.getAliasName().toLowerCase());
            }
        }
        log.info("[Voice] knownNames ({} entries): {}", knownNames.size(), knownNames);
        List<ParsedItem> parsedItems = parseVoiceTextToItems(text, knownNames);
        long parseTime = System.currentTimeMillis() - parseStart;
        log.info("[Voice] Parsed items   : {}", parsedItems);

        if (parsedItems.isEmpty()) {
            log.info("[Voice] No items parsed. Total time: {}ms", System.currentTimeMillis() - totalStart);
            return VoiceResponse.builder()
                    .recognizedText(request.getText())
                    .matchedItems(Collections.emptyList())
                    .unmatchedItems(Collections.emptyList())
                    .build();
        }

        // STEP 4: Build alias product map from ALL aliases (batch fetch)
        List<String> aliases = parsedItems.stream()
                .map(ParsedItem::productWord)
                .filter(Objects::nonNull)
                .filter(w -> !w.isBlank())
                .distinct()
                .collect(Collectors.toList());

        Map<String, Product> aliasProductMap = batchFetchByAliases(aliases, cid);

        // Also add DB lookup entries for the parsed product words
        for (ParsedItem item : parsedItems) {
            if (item.productWord() == null) continue;
            String pw = item.productWord().toLowerCase();
            if (!aliasProductMap.containsKey(pw)) {
                Product p = dbLookup.get(pw);
                if (p != null) {
                    aliasProductMap.put(pw, p);
                }
            }
        }

        log.info("[Voice] Alias map: {} entries", aliasProductMap.size());

        // STEP 5: Create one CompletableFuture per product
        long processingStart = System.currentTimeMillis();
        List<CompletableFuture<ProcessResult>> futures = parsedItems.stream()
                .map(item -> CompletableFuture.supplyAsync(
                        () -> processItemAsync(item, aliasProductMap, allActiveProducts, dbLookup),
                        voiceBillingExecutor
                ))
                .collect(Collectors.toList());

        // STEP 6: Wait for ALL futures to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // STEP 7: Collect all results
        List<VoiceResponse.VoiceItem> matchedItems = new ArrayList<>();
        List<VoiceResponse.UnmatchedItem> unmatchedItems = new ArrayList<>();
        List<String> threadsUsed = new ArrayList<>();

        for (CompletableFuture<ProcessResult> future : futures) {
            try {
                ProcessResult result = future.get();
                if (result.threadName() != null && !threadsUsed.contains(result.threadName())) {
                    threadsUsed.add(result.threadName());
                }
                if (result.matched()) {
                    matchedItems.add(result.voiceItem());
                } else {
                    unmatchedItems.add(result.unmatchedItem());
                }
            } catch (Exception e) {
                log.error("[Voice] Failed to collect future result", e);
            }
        }

        long processingTime = System.currentTimeMillis() - processingStart;
        long totalTime = System.currentTimeMillis() - totalStart;

        log.info("==================================================");
        log.info("           ASYNC EXECUTION SUMMARY                ");
        log.info("==================================================");
        log.info("Products Received : {}", parsedItems.size());
        log.info("Threads Used      :");
        for (String thread : threadsUsed) {
            log.info("                    {}", thread);
        }
        log.info("Products Matched  : {}", matchedItems.size());
        log.info("Products Unmatched: {}", unmatchedItems.size());
        log.info("Total Time        : {} ms", totalTime);
        log.info("==================================================");

        log.info("[Voice] Performance — Parse: {}ms | DB: {}ms | Process: {}ms | Total: {}ms",
                parseTime, dbTime, processingTime, totalTime);
        log.info("[Voice] ════════════════════════════════════════════");
        log.info("[Voice] RETURNING:");
        matchedItems.forEach(m -> log.info("[Voice]   MATCHED   : {} x {} {} @ ₹{}", m.getQuantity(), m.getProductName(), m.getUnit(), m.getPrice()));
        unmatchedItems.forEach(u -> log.info("[Voice]   UNMATCHED : {} x {} {} (suggestions: {})", u.getQuantity(), u.getSpokenText(), u.getUnit(), u.getSuggestions().size()));
        log.info("[Voice] ════════════════════════════════════════════");

        return VoiceResponse.builder()
                .recognizedText(request.getText())
                .matchedItems(matchedItems)
                .unmatchedItems(unmatchedItems)
                .build();
    }

    // =========================================================================
    // STEP 2 & 3: Batch database queries
    // =========================================================================

    private Map<String, Product> batchFetchByAliases(List<String> aliases, Long cid) {
        if (aliases.isEmpty()) {
            return new HashMap<>();
        }

        List<String> lowerAliases = aliases.stream()
                .map(String::toLowerCase)
                .distinct()
                .collect(Collectors.toList());

        List<ProductAlias> productAliases = productAliasRepository.findByAliasNamesIn(lowerAliases, cid);

        return productAliases.stream()
                .filter(pa -> pa.getProduct() != null && "active".equals(pa.getProduct().getStatus()))
                .collect(Collectors.toMap(
                        pa -> pa.getAliasName().toLowerCase(),
                        ProductAlias::getProduct,
                        (existing, duplicate) -> existing
                ));
    }

    // =========================================================================
    // STEP 5: CompletableFuture per product — fully independent processing
    // =========================================================================

    private ProcessResult processItemAsync(ParsedItem item,
                                           Map<String, Product> aliasProductMap,
                                           List<Product> allActiveProducts,
                                           Map<String, Product> dbLookup) {
        String threadName = Thread.currentThread().getName();
        String productName = item.productWord();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");
        long startTime = System.currentTimeMillis();

        log.info("--------------------------------------------------");
        log.info("START  Product : {}", capitalizeFirst(productName));
        log.info("Thread         : {}", threadName);
        log.info("Time           : {}", LocalDateTime.now().format(fmt));
        log.info("--------------------------------------------------");

        try {
            Product product = null;

            if (item.productWord() != null) {
                String pw = item.productWord().toLowerCase().trim();
                log.info("[Voice] Looking up   : \"{}\"", pw);

                product = aliasProductMap.get(pw);
                log.info("[Voice] Step 1 aliasMap : {} → {}", pw, product != null ? product.getProductName() : "NULL");

                if (product == null) {
                    product = dbLookup.get(pw);
                    log.info("[Voice] Step 2 dbLookup: {} → {}", pw, product != null ? product.getProductName() : "NULL");
                }

                if (product == null) {
                    product = findByNameMatch(pw, allActiveProducts);
                    log.info("[Voice] Step 3 fuzzy   : {} → {}", pw, product != null ? product.getProductName() : "NULL");
                }
            }

            if (product == null || !"active".equals(product.getStatus())) {
                List<VoiceResponse.SuggestedProduct> suggestions = findSuggestions(
                        item.productWord(), allActiveProducts);
                log.info("--------------------------------------------------");
                log.info("END    Product : {} [UNMATCHED]", capitalizeFirst(productName));
                log.info("Suggestions    : {}",
                        suggestions.stream().map(VoiceResponse.SuggestedProduct::getProductName).collect(Collectors.joining(", ")));
                log.info("Thread         : {}", threadName);
                log.info("Duration       : {} ms", System.currentTimeMillis() - startTime);
                log.info("Time           : {}", LocalDateTime.now().format(fmt));
                log.info("--------------------------------------------------");
                return ProcessResult.unmatched(VoiceResponse.UnmatchedItem.builder()
                        .spokenText(capitalizeFirst(item.productWord()))
                        .quantity(item.quantity())
                        .unit(item.unit())
                        .suggestions(suggestions)
                        .build(), threadName);
            }

            // Stock check disabled for hotel use case (re-enable later)
            // if (product.getStock() != null && product.getStock() < item.quantity()) {
            //     log.warn("[Voice] Low stock: {} requested {} but only {} available",
            //             product.getProductName(), item.quantity(), product.getStock());
            // }

            BigDecimal gstPercentage = product.getGstPercentage() != null
                    ? product.getGstPercentage() : BigDecimal.ZERO;

            BigDecimal lineSubtotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(item.quantity()));

            BigDecimal gstAmount = BigDecimal.ZERO;
            if (gstPercentage.compareTo(BigDecimal.ZERO) > 0) {
                gstAmount = lineSubtotal
                        .multiply(gstPercentage)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }

            BigDecimal lineTotal = lineSubtotal.add(gstAmount);

            log.debug("[Voice] Matched: {} x {} {} = ₹{} (GST: {}%)",
                    item.quantity(), product.getProductName(), item.unit(),
                    lineTotal, gstPercentage);

            log.info("--------------------------------------------------");
            log.info("END    Product : {} [MATCHED]", product.getProductName());
            log.info("Thread         : {}", threadName);
            log.info("Duration       : {} ms", System.currentTimeMillis() - startTime);
            log.info("Time           : {}", LocalDateTime.now().format(fmt));
            log.info("--------------------------------------------------");

            return ProcessResult.matched(VoiceResponse.VoiceItem.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .tamilName(product.getTamilName())
                    .quantity(item.quantity())
                    .unit(item.unit() != null && !item.unit().isBlank() ? item.unit() : "pcs")
                    .price(product.getPrice())
                    .gstPercentage(gstPercentage)
                    .build(), threadName);

        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("[Voice] Error processing item '{}': {}", item.productWord(), e.getMessage(), e);
            log.info("--------------------------------------------------");
            log.info("END    Product : {} [ERROR]", capitalizeFirst(productName));
            log.info("Thread         : {}", threadName);
            log.info("Duration       : {} ms", System.currentTimeMillis() - startTime);
            log.info("Time           : {}", LocalDateTime.now().format(fmt));
            log.info("--------------------------------------------------");
            List<VoiceResponse.SuggestedProduct> suggestions = findSuggestions(
                    item.productWord(), allActiveProducts);
            return ProcessResult.unmatched(VoiceResponse.UnmatchedItem.builder()
                    .spokenText(capitalizeFirst(item.productWord()))
                    .quantity(item.quantity())
                    .unit(item.unit())
                    .suggestions(suggestions)
                    .build(), threadName);
        }
    }

    // =========================================================================
    // STEP 7: In-memory product matching + suggestions
    // =========================================================================

    private List<VoiceResponse.SuggestedProduct> findSuggestions(String spokenText,
                                                                 List<Product> allActiveProducts) {
        if (spokenText == null || spokenText.isBlank()) {
            return Collections.emptyList();
        }

        String cleaned = spokenText.trim().toLowerCase();

        return allActiveProducts.stream()
                .filter(p -> "active".equals(p.getStatus()))
                .map(p -> Map.entry(p, calculateRelevance(cleaned, p)))
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<Product, Integer>comparingByValue().reversed())
                .limit(3)
                .map(e -> VoiceResponse.SuggestedProduct.builder()
                        .productId(e.getKey().getProductId())
                        .productName(e.getKey().getProductName())
                        .tamilName(e.getKey().getTamilName())
                        .price(e.getKey().getPrice())
                        .gstPercentage(e.getKey().getGstPercentage())
                        .build())
                .collect(Collectors.toList());
    }

    private int calculateRelevance(String cleaned, Product product) {
        int score = 0;

        String productName = product.getProductName().toLowerCase();
        String tamilName = product.getTamilName() != null ? product.getTamilName().toLowerCase() : "";

        if (productName.equals(cleaned)) return 100;

        if (productName.contains(cleaned)) score += 80;
        if (cleaned.contains(productName)) score += 70;

        if (!tamilName.isEmpty()) {
            if (tamilName.equals(cleaned)) score += 90;
            if (tamilName.contains(cleaned) || cleaned.contains(tamilName)) {
                score += 60;
            }
        }

        // Check DB aliases for this product
        List<ProductAlias> productAliases = productAliasRepository.findByProduct_ProductIdAndCompanyId(product.getProductId(), currentUserProvider.getCompanyId());
        for (ProductAlias pa : productAliases) {
            if (pa.getAliasName() != null && pa.getAliasName().toLowerCase().equals(cleaned)) {
                score += 85;
                break;
            }
        }

        String[] spokenWords = cleaned.split("\\s+");
        String[] productWords = productName.split("\\s+");
        for (String sw : spokenWords) {
            if (sw.length() < 3) continue;
            for (String pw : productWords) {
                if (pw.length() < 3) continue;
                if (sw.contains(pw) || pw.contains(sw)) {
                    score += 30;
                }
            }
        }

        if (!tamilName.isEmpty()) {
            String[] tamilWords = tamilName.split("\\s+");
            for (String sw : spokenWords) {
                if (sw.length() < 3) continue;
                for (String tw : tamilWords) {
                    if (tw.length() < 3) continue;
                    if (sw.contains(tw) || tw.contains(sw)) {
                        score += 20;
                    }
                }
            }
        }

        return score;
    }

    private Product findByNameMatch(String productWord, List<Product> allActiveProducts) {
        if (productWord == null || productWord.isBlank()) {
            return null;
        }

        String cleaned = productWord.trim().toLowerCase();

        for (Product product : allActiveProducts) {
            if (product.getProductName() != null
                    && product.getProductName().toLowerCase().equals(cleaned)) {
                return product;
            }
            if (product.getTamilName() != null
                    && product.getTamilName().toLowerCase().equals(cleaned)) {
                return product;
            }
        }

        for (Product product : allActiveProducts) {
            if (product.getProductName() != null
                    && product.getProductName().toLowerCase().contains(cleaned)) {
                return product;
            }
            if (product.getTamilName() != null
                    && product.getTamilName().toLowerCase().contains(cleaned)) {
                return product;
            }
            if (cleaned.contains(product.getProductName().toLowerCase())) {
                return product;
            }
        }

        return null;
    }

    // =========================================================================
    // STEP 14: Save voice alias — called from separate endpoint
    // =========================================================================

    @Override
    public void saveVoiceAlias(String spokenText, Long productId) {
        String cleaned = spokenText.trim().toLowerCase();
        Long cid = currentUserProvider.getCompanyId();

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
        if (product.getCompanyId() != null && !product.getCompanyId().equals(cid)) {
            throw new RuntimeException("Product not found: " + productId);
        }

        List<ProductAlias> existing = productAliasRepository.findByAliasNameIgnoreCase(cleaned, cid);
        boolean alreadyExists = existing.stream()
                .anyMatch(pa -> pa.getProduct().getProductId().equals(productId));
        if (alreadyExists) {
            return;
        }

        ProductAlias alias = ProductAlias.builder()
                .product(product)
                .aliasName(cleaned)
                .companyId(cid)
                .build();
        productAliasRepository.save(alias);
    }

    // =========================================================================
    // STEP 3: Voice parser — product-first approach
    // Find product names in text FIRST, then extract qty/unit from surrounding context
    // =========================================================================

    private List<ParsedItem> parseVoiceTextToItems(String text, Set<String> knownProductNames) {
        List<ParsedItem> items = new ArrayList<>();
        if (text == null || text.isBlank()) return items;

        String lower = text.toLowerCase();
        String normalizedText = normalizeNumberWords(lower);
        normalizedText = normalizeForMatch(normalizedText);

        // Build candidates sorted by length DESCENDING (longest first)
        // This ensures "onion dosa" is tried before "dosa"
        List<Map.Entry<String, String>> candidates = new ArrayList<>();
        for (String name : knownProductNames) {
            String norm = normalizeForMatch(name);
            if (norm != null && !norm.isEmpty()) {
                candidates.add(Map.entry(norm, name));
            }
        }
        candidates.sort((a, b) -> {
            int lenCmp = Integer.compare(b.getKey().length(), a.getKey().length());
            if (lenCmp != 0) return lenCmp;
            return a.getKey().compareTo(b.getKey());
        });

        log.info("[Voice] Candidates sorted by length (top 10): {}",
                candidates.stream().limit(10)
                        .map(e -> e.getKey() + " (" + e.getKey().length() + ")")
                        .collect(Collectors.toList()));

        // Greedy longest-match-first scan
        List<ProductHit> hits = new ArrayList<>();
        int pos = 0;

        while (pos < normalizedText.length()) {
            // Skip spaces
            while (pos < normalizedText.length() && normalizedText.charAt(pos) == ' ') {
                pos++;
            }
            if (pos >= normalizedText.length()) break;

            // At this position, try ALL candidates (longest first). First match wins.
            ProductHit bestHit = null;
            for (Map.Entry<String, String> candidate : candidates) {
                String normName = candidate.getKey();
                String origName = candidate.getValue();

                if (pos + normName.length() > normalizedText.length()) continue;

                // Check exact match at this position
                String segment = normalizedText.substring(pos, pos + normName.length());
                if (!segment.equals(normName)) continue;

                // Ensure match is at a word boundary (not a substring of a longer word)
                boolean leftOk = (pos == 0 || normalizedText.charAt(pos - 1) == ' ');
                int rightEnd = pos + normName.length();
                boolean rightOk = (rightEnd >= normalizedText.length()
                        || normalizedText.charAt(rightEnd) == ' ');

                // For single-word product names, enforce word boundaries
                if (!normName.contains(" ")) {
                    if (!leftOk || !rightOk) continue;
                } else {
                    // For multi-word products, at minimum ensure the start is a word boundary
                    if (!leftOk) continue;
                    // The end can be relaxed — "onion dosa two" should match "onion dosa"
                    // even though "two" follows without requiring a space at the exact boundary
                    // (the space is between "dosa" and "two", which is fine)
                    if (rightEnd < normalizedText.length()
                            && normalizedText.charAt(rightEnd) != ' '
                            && Character.isLetter(normalizedText.charAt(rightEnd))) {
                        continue;
                    }
                }

                bestHit = new ProductHit(origName, pos, pos + normName.length());
                break; // First (longest) match wins
            }

            if (bestHit != null) {
                hits.add(bestHit);
                log.info("[Voice] Hit: \"{}\" at pos {}-{} → \"{}\"",
                        normalizedText.substring(bestHit.start, bestHit.end),
                        bestHit.start, bestHit.end, bestHit.name);
                pos = bestHit.end;
            } else {
                pos++;
            }
        }

        if (hits.isEmpty()) {
            ParsedItem single = parseSingleSegmentToItem(normalizedText);
            if (single != null) items.add(single);
            return items;
        }

        log.info("[Voice] Final product hits: {}", hits);

        // Extract quantity from context before/after each product
        for (int i = 0; i < hits.size(); i++) {
            ProductHit hit = hits.get(i);
            int contextStart = (i > 0) ? hits.get(i - 1).end : 0;
            int contextEnd = hit.start;
            String contextBefore = normalizedText.substring(contextStart, contextEnd);

            double quantity = extractQuantity(contextBefore);
            String unit = extractUnit(contextBefore);
            String unitNorm = unit != null ? unit : "pcs";
            quantity = normalizeQuantity(quantity, unit);
            if ("g".equals(unit)) unitNorm = "kg";
            if ("ml".equals(unit)) unitNorm = "l";

            // If no quantity before, check text AFTER the product name
            if (quantity == 1 && (contextBefore.isBlank() || contextBefore.trim().isEmpty())) {
                int afterStart = hit.end;
                int afterEnd = (i + 1 < hits.size()) ? hits.get(i + 1).start : normalizedText.length();
                if (afterEnd > afterStart) {
                    String contextAfter = normalizedText.substring(afterStart, afterEnd);
                    double qtyAfter = extractQuantity(contextAfter);
                    if (qtyAfter != 1) {
                        quantity = qtyAfter;
                        String unitAfter = extractUnit(contextAfter);
                        if (unitAfter != null) {
                            unitNorm = unitAfter;
                            quantity = normalizeQuantity(quantity, unitAfter);
                            if ("g".equals(unitAfter)) unitNorm = "kg";
                            if ("ml".equals(unitAfter)) unitNorm = "l";
                        }
                    }
                }
            }

            log.info("[Voice] Product=\"{}\" contextBefore=\"{}\" qty={} unit={}", hit.name, contextBefore, quantity, unitNorm);
            items.add(new ParsedItem(hit.name, quantity, unitNorm));
        }

        return items;
    }

    private record ProductHit(String name, int start, int end) {}

    private String normalizeForMatch(String s) {
        if (s == null) return null;
        String n = s.toLowerCase().trim();
        n = n.replaceAll("\\s+", " ");
        n = n.replaceAll("briyani", "biryani");
        n = n.replaceAll("parotha", "parotta");
        n = n.replaceAll("chappathi", "chappathi");
        return n;
    }

    private ParsedItem parseSingleSegmentToItem(String segment) {
        segment = segment.trim();

        double quantity = extractQuantity(segment);
        String unit = extractUnit(segment);
        String unitNorm = unit != null ? unit : "pcs";
        quantity = normalizeQuantity(quantity, unit);
        if ("g".equals(unit)) unitNorm = "kg";
        if ("ml".equals(unit)) unitNorm = "l";
        String productWord = extractProductWord(segment);

        if (productWord == null || productWord.isBlank()) {
            return null;
        }

        return new ParsedItem(productWord, quantity, unitNorm);
    }

    private List<String> splitByNumberWords(String text) {
        List<String> allNumberWords = new ArrayList<>();
        allNumberWords.addAll(TAMIL_NUMBER_MAP.keySet());
        allNumberWords.addAll(ENGLISH_NUMBER_MAP.keySet());

        StringBuilder patternBuilder = new StringBuilder("(?i)(\\b(?:");
        boolean first = true;
        for (String nw : allNumberWords) {
            if (!first) patternBuilder.append("|");
            patternBuilder.append(Pattern.quote(nw));
            first = false;
        }
        patternBuilder.append("|\\d+)\\b)");

        Pattern numberPattern = Pattern.compile(patternBuilder.toString());
        Matcher matcher = numberPattern.matcher(text);

        List<int[]> positions = new ArrayList<>();
        while (matcher.find()) {
            positions.add(new int[]{matcher.start(), matcher.end()});
        }

        List<String> segments = new ArrayList<>();

        if (positions.isEmpty()) {
            segments.add(text);
            return segments;
        }

        int firstStart = positions.get(0)[0];
        if (firstStart > 0) {
            String prefix = text.substring(0, firstStart).trim();
            if (!prefix.isEmpty()) {
                segments.add(prefix);
            }
        }

        for (int i = 0; i < positions.size(); i++) {
            int start = positions.get(i)[0];
            int end = (i + 1 < positions.size()) ? positions.get(i + 1)[0] : text.length();
            String segment = text.substring(start, end).trim();
            if (!segment.isEmpty()) {
                segments.add(segment);
            }
        }

        return segments;
    }

    // =========================================================================
    // Text extraction helpers
    // =========================================================================

    // =========================================================================
    // Quantity normalization — spoken number words → digits (hardcoded, no AI/NLP)
    // Applied BEFORE product matching so "three idly" == "3 idly", "மூணு இட்லி" == "3 இட்லி".
    // =========================================================================

    private String normalizeNumberWords(String text) {
        if (text == null || text.isBlank()) return text;

        String result = text.toLowerCase();

        // Fraction phrases first (guarded so product names like "half boil" are not converted)
        result = replaceFractionPhrase(result, "மூன்றில் ஒரு", "1/3");
        result = replaceFractionPhrase(result, "முன்னூறில் ஒரு", "1/3");
        result = replaceFractionPhrase(result, "முக்கால்", "3/4");
        result = replaceFractionPhrase(result, "mukkal", "3/4");
        result = replaceFractionPhrase(result, "two thirds", "2/3");
        result = replaceFractionPhrase(result, "two third", "2/3");
        result = replaceFractionPhrase(result, "three quarters", "3/4");
        result = replaceFractionPhrase(result, "three quarter", "3/4");
        result = replaceFractionPhrase(result, "one quarter", "1/4");
        result = replaceFractionPhrase(result, "one third", "1/3");
        result = replaceFractionPhrase(result, "one half", "1/2");
        result = replaceFractionPhrase(result, "half", "1/2");
        result = replaceFractionPhrase(result, "quarter", "1/4");
        result = replaceFractionPhrase(result, "அரை", "1/2");
        result = replaceFractionPhrase(result, "arai", "1/2");
        result = replaceFractionPhrase(result, "கால்", "1/4");
        result = replaceFractionPhrase(result, "kaal", "1/4");

        // Spoken number words → digits, longest word first so "eighteen" wins over "eight"
        for (Map.Entry<String, String> entry : NUMBER_WORD_ENTRIES) {
            String word = entry.getKey();
            Pattern p = Pattern.compile(
                    "(?i)(?<![\\p{L}\\p{M}\\d])" + Pattern.quote(word) + "(?![\\p{L}\\p{M}])");
            result = result.replaceAll(p.pattern(), entry.getValue());
        }

        return result.trim();
    }

    private String replaceFractionPhrase(String text, String phrase, String replacement) {
        if (text == null || text.isEmpty() || phrase == null || phrase.isEmpty()) return text;
        if (!text.toLowerCase().contains(phrase.toLowerCase())) return text;

        Pattern p = Pattern.compile(
                "(?i)(?<![\\p{L}\\p{M}\\d])" + Pattern.quote(phrase) + "(?![\\p{L}\\p{M}])");
        Matcher m = p.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            if (isFollowedByProductWord(text, m.group())) {
                // e.g. "half boil" — the fraction word is part of a product name
                m.appendReplacement(sb, Matcher.quoteReplacement(m.group()));
            } else {
                m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
            }
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private boolean wordBoundaryFind(String text, String word) {
        return Pattern.compile(
                "(?i)(?<![\\p{L}\\p{M}\\d])" + Pattern.quote(word) + "(?![\\p{L}\\p{M}])")
                .matcher(text).find();
    }

    private double extractQuantity(String segment) {
        String lower = segment.toLowerCase();

        // 1) Fraction patterns: 1/2, 3/4, 1/4, etc.
        Matcher fracMatcher = Pattern.compile("(\\d+)\\s*/\\s*(\\d+)").matcher(segment);
        if (fracMatcher.find()) {
            double num = Double.parseDouble(fracMatcher.group(1));
            double den = Double.parseDouble(fracMatcher.group(2));
            if (den != 0) return num / den;
        }

        // 2) English fraction words — only when followed by a unit or at end, not when
        //    followed by a product-name word (e.g. "half boil" is a product, not 0.5 boil)
        if (lower.contains("half") && !isFollowedByProductWord(lower, "half")) return 0.5;
        if (lower.contains("quarter") && !isFollowedByProductWord(lower, "quarter")) return 0.25;
        if (lower.contains("three quarter") || lower.contains("three quarters")) return 0.75;
        if (lower.contains("one half")) return 0.5;
        if (lower.contains("one quarter")) return 0.25;
        if (lower.contains("one third")) return 1.0 / 3.0;
        if (lower.contains("two third") || lower.contains("two thirds")) return 2.0 / 3.0;

        // 3) Tamil fraction words (both Tamil script and Tanglish)
        if ((lower.contains("அரை") || lower.contains("arai")) && !isFollowedByProductWord(lower, "அரை")) return 0.5;
        if ((lower.contains("கால்") || lower.contains("kaal")) && !isFollowedByProductWord(lower, "கால்")) return 0.25;
        if (lower.contains("முக்கால்") || lower.contains("mukkal")) return 0.75;
        if (lower.contains("மூன்றில் ஒரு") || lower.contains("முன்னூறில் ஒரு")) return 1.0 / 3.0;

        // 4) Numeric digits
        Matcher numberMatcher = Pattern.compile("(\\d+)").matcher(segment);
        if (numberMatcher.find()) {
            return Double.parseDouble(numberMatcher.group(1));
        }

        // 5) Number words (English, Tamil, Tanglish) — longest word first, word-boundary match
        for (Map.Entry<String, String> entry : NUMBER_WORD_ENTRIES) {
            if (wordBoundaryFind(lower, entry.getKey())) {
                return Double.parseDouble(entry.getValue());
            }
        }

        // 6) Extra English number words (thirty, forty, fifty)
        for (Map.Entry<String, Integer> entry : ENGLISH_NUMBER_MAP.entrySet()) {
            if (wordBoundaryFind(lower, entry.getKey())) {
                return entry.getValue();
            }
        }

        return 1;
    }

    private String extractUnit(String segment) {
        for (Map.Entry<String, String> entry : UNIT_PATTERNS.entrySet()) {
            if (Pattern.compile(entry.getKey(), Pattern.CASE_INSENSITIVE).matcher(segment).find()) {
                return entry.getValue();
            }
        }
        return null;
    }

    private double normalizeQuantity(double quantity, String unit) {
        if (unit == null) return quantity;
        if ("g".equals(unit)) return quantity / 1000.0;
        if ("ml".equals(unit)) return quantity / 1000.0;
        return quantity;
    }

    private String extractProductWord(String segment) {
        String cleaned = segment;

        cleaned = cleaned.replaceAll("\\d+", "").trim();

        for (String unitPattern : UNIT_PATTERNS.keySet()) {
            cleaned = cleaned.replaceAll("(?i)" + unitPattern, "").trim();
        }

        for (String numWord : TAMIL_NUMBER_MAP.keySet()) {
            cleaned = cleaned.replaceAll("(?i)\\b" + Pattern.quote(numWord) + "\\b", "").trim();
        }

        for (String numWord : ENGLISH_NUMBER_MAP.keySet()) {
            cleaned = cleaned.replaceAll("(?i)\\b" + Pattern.quote(numWord) + "\\b", "").trim();
        }

        cleaned = cleaned.replaceAll("[,]+", "").trim();

        return cleaned;
    }

    private String capitalizeFirst(String text) {
        if (text == null || text.isEmpty()) return text;
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }

    /**
     * Returns true if the fraction word is followed by a non-unit word,
     * meaning it's part of a product name (e.g. "half boil") not a quantity.
     */
    private boolean isFollowedByProductWord(String text, String fractionWord) {
        int idx = text.indexOf(fractionWord);
        if (idx < 0) return false;
        String after = text.substring(idx + fractionWord.length()).trim();
        if (after.isEmpty()) return false;
        String firstWord = after.split("\\s+")[0];
        if (firstWord.isEmpty()) return false;
        if (firstWord.matches("\\d+")) return false;
        for (String unit : UNIT_PATTERNS.keySet()) {
            if (firstWord.equalsIgnoreCase(unit)) return false;
        }
        for (String numWord : ENGLISH_NUMBER_MAP.keySet()) {
            if (firstWord.equalsIgnoreCase(numWord)) return false;
        }
        for (String numWord : TAMIL_NUMBER_MAP.keySet()) {
            if (firstWord.equalsIgnoreCase(numWord)) return false;
        }
        return true;
    }

    // =========================================================================
    // Immutable DTOs — no shared mutable state
    // =========================================================================

    private record ParsedItem(String productWord, double quantity, String unit) {}

    private record ProcessResult(VoiceResponse.VoiceItem voiceItem,
                                 VoiceResponse.UnmatchedItem unmatchedItem,
                                 String threadName) {

        boolean matched() { return voiceItem != null; }

        static ProcessResult matched(VoiceResponse.VoiceItem item, String threadName) {
            return new ProcessResult(item, null, threadName);
        }

        static ProcessResult unmatched(VoiceResponse.UnmatchedItem item, String threadName) {
            return new ProcessResult(null, item, threadName);
        }
    }
}
