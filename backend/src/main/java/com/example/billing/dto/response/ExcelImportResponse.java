package com.example.billing.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExcelImportResponse {

    private int totalRows;
    private int successCount;
    private int errorCount;
    private int aliasesImported;
    private int duplicatesSkipped;
    private List<String> errors;
    private List<String> importedProducts;
}
