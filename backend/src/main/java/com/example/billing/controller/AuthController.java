package com.example.billing.controller;

import com.example.billing.dto.request.LoginRequest;
import com.example.billing.dto.response.LoginResponse;
import com.example.billing.repository.UserRepository;
import com.example.billing.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus() {
        boolean hasUsers = userRepository.count() > 0;
        return ResponseEntity.ok(Map.of("hasUsers", hasUsers));
    }
}
