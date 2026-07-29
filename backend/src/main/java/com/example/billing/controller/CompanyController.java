package com.example.billing.controller;

import com.example.billing.dto.request.CompanyRequest;
import com.example.billing.dto.response.CompanyResponse;
import com.example.billing.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<CompanyResponse> getCompany() {
        CompanyResponse response = companyService.getActiveCompany();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> saveCompany(@Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = companyService.saveCompany(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = companyService.updateCompany(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logo")
    public ResponseEntity<CompanyResponse> uploadLogo(
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        CompanyResponse activeCompany = companyService.getActiveCompany();
        if (activeCompany.getCompanyId() == null) {
            return ResponseEntity.badRequest().build();
        }
        CompanyResponse response = companyService.uploadLogo(activeCompany.getCompanyId(), file);
        return ResponseEntity.ok(response);
    }
}
