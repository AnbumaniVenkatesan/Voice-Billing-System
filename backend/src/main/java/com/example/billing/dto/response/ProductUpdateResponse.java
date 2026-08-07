package com.example.billing.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductUpdateResponse {

    private int totalRows;
    private int updatedCount;
    private int skippedCount;
    private int notFoundCount;
    private List<String> updated;
    private List<String> skipped;
    private List<String> notFound;
    private List<String> errors;
}
