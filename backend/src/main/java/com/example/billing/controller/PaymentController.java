package com.example.billing.controller;

import com.example.billing.dto.request.PaymentRequest;
import com.example.billing.dto.response.PaymentResponse;
import com.example.billing.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payments/create")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/gateway/paytm/initiate")
    public ResponseEntity<PaymentResponse> initiatePaytmPayment(@RequestParam Long invoiceId) {
        PaymentResponse response = paymentService.initiatePaytmPayment(invoiceId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/gateway/paytm/callback")
    public ResponseEntity<PaymentResponse> handlePaytmCallback(@RequestBody Map<String, String> callbackParams) {
        PaymentResponse response = paymentService.handlePaytmCallback(callbackParams);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments/invoice/{invoiceId}")
    public ResponseEntity<PaymentResponse> getPaymentByInvoiceId(@PathVariable Long invoiceId) {
        PaymentResponse response = paymentService.getPaymentByInvoiceId(invoiceId);
        return ResponseEntity.ok(response);
    }
}
