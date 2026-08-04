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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CompanyService companyService;

    @GetMapping("/companies")
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<CompanyResponse> getCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @PostMapping("/companies")
    public ResponseEntity<CompanyResponse> createCompany(@Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.saveCompany(request));
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.updateCompany(id, request));
    }

    @PostMapping("/companies/{id}/activate")
    public ResponseEntity<CompanyResponse> activateCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.activateCompany(id));
    }

    @PostMapping("/companies/{id}/deactivate")
    public ResponseEntity<CompanyResponse> deactivateCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.deactivateCompany(id));
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/companies/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetCompanyPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        companyService.resetCompanyPassword(id, body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Company admin password reset successfully"));
    }

    @PostMapping("/companies/{id}/logo")
    public ResponseEntity<CompanyResponse> uploadLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(companyService.uploadLogo(id, file));
    }

    @GetMapping("/companies/{id}/stats")
    public ResponseEntity<Map<String, Object>> getCompanyStats(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyStats(id));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(companyService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String password = (String) body.get("password");
        String role = (String) body.get("role");
        Long companyId = body.get("companyId") != null ? Long.valueOf(body.get("companyId").toString()) : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.createUser(username, password, role, companyId));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetUserPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        companyService.resetUserPassword(id, body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "User password reset successfully"));
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable Long id) {
        companyService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        companyService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
