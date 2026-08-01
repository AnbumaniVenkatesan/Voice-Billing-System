package com.example.billing.controller;

import com.example.billing.dto.request.InvoiceRequest;
import com.example.billing.dto.response.InvoiceResponse;
import com.example.billing.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        List<InvoiceResponse> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(invoice);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<InvoiceResponse> markCompleted(
            @PathVariable Long id,
            @RequestParam(defaultValue = "cash") String gateway) {
        InvoiceResponse response = invoiceService.markCompleted(id, gateway);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}
