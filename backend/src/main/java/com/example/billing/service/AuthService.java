package com.example.billing.service;

import com.example.billing.dto.request.LoginRequest;
import com.example.billing.dto.response.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}
