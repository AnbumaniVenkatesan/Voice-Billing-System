package com.example.billing.service.impl;

import com.example.billing.config.JwtTokenProvider;
import com.example.billing.dto.request.LoginRequest;
import com.example.billing.dto.response.LoginResponse;
import com.example.billing.entity.User;
import com.example.billing.repository.UserRepository;
import com.example.billing.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername() == null ? null : request.getUsername().trim();
        log.info("Login attempt for user '{}'", username);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.getPassword())
        );

        log.info("Password verified successfully for user '{}'", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        String token = jwtTokenProvider.generateToken(user);

        log.info("JWT generated and login succeeded for user '{}'", username);

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .companyId(user.getCompanyId())
                .expiresAt(LocalDateTime.now().plusSeconds(86400))
                .build();
    }

    @Override
    public void createSuperAdmin(String username, String password) {
        if (userRepository.existsByRole("SUPER_ADMIN")) {
            throw new IllegalStateException("Super admin already exists");
        }
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        String trimmedUsername = username.trim();
        if (userRepository.existsByUsername(trimmedUsername)) {
            throw new IllegalArgumentException("Username already exists: " + trimmedUsername);
        }
        User superAdmin = User.builder()
                .username(trimmedUsername)
                .password(passwordEncoder.encode(password))
                .role("SUPER_ADMIN")
                .isActive(true)
                .build();
        userRepository.save(superAdmin);
        log.info("Super admin '{}' created", trimmedUsername);
    }
}
