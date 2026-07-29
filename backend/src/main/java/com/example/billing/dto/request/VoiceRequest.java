package com.example.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceRequest {

    @NotBlank(message = "Voice text is required")
    private String text;
}
