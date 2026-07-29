package com.example.billing.service;

import com.example.billing.dto.request.InvoiceRequest;
import com.example.billing.dto.response.InvoiceResponse;
import java.util.List;

public interface InvoiceService {

    InvoiceResponse createInvoice(InvoiceRequest request);

    List<InvoiceResponse> getAllInvoices();

    InvoiceResponse getInvoiceById(Long id);

    List<InvoiceResponse> getInvoicesByCustomerId(Long customerId);

    InvoiceResponse markCompleted(Long invoiceId, String gateway);
}
