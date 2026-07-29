package com.example.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceAliasRequest {

    @NotBlank(message = "Spoken text is required")
    private String spokenText;

    @NotNull(message = "Product ID is required")
    private Long productId;
}
