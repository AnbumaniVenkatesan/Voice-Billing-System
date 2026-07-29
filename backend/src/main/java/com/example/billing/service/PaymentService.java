package com.example.billing.service;

import com.example.billing.dto.request.PaymentRequest;
import com.example.billing.dto.response.PaymentResponse;
import java.util.Map;

public interface PaymentService {

    PaymentResponse createPayment(PaymentRequest request);

    PaymentResponse initiatePaytmPayment(Long invoiceId);

    PaymentResponse handlePaytmCallback(Map<String, String> callbackParams);

    PaymentResponse getPaymentByInvoiceId(Long invoiceId);
}
