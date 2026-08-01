package com.example.billing.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private Long companyId;
    private LocalDateTime expiresAt;
}
