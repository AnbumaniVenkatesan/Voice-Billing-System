package com.example.billing.service.impl;

import com.example.billing.dto.request.CompanyRequest;
import com.example.billing.dto.response.CompanyResponse;
import com.example.billing.entity.Company;
import com.example.billing.entity.User;
import com.example.billing.exception.ResourceNotFoundException;
import com.example.billing.repository.CompanyRepository;
import com.example.billing.repository.UserRepository;
import com.example.billing.service.CompanyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads/company}")
    private String uploadDir;

    @Override
    public CompanyResponse getActiveCompany() {
        Company company = companyRepository.findByIsActiveTrue()
                .orElse(null);
        if (company == null) {
            return CompanyResponse.builder()
                    .companyName("Smart Billing System")
                    .currency("₹")
                    .invoicePrefix("INV")
                    .build();
        }
        return mapToResponse(company);
    }

    @Override
    @Transactional
    public CompanyResponse saveCompany(CompanyRequest request) {
        Company existing = companyRepository.findByIsActiveTrue().orElse(null);

        if (existing != null) {
            return updateCompany(existing.getCompanyId(), request);
        }

        Company company = Company.builder()
                .companyName(request.getCompanyName())
                .ownerName(request.getOwnerName())
                .shopType(request.getShopType())
                .gstNumber(request.getGstNumber())
                .panNumber(request.getPanNumber())
                .phoneNumber(request.getPhoneNumber())
                .alternatePhone(request.getAlternatePhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .district(request.getDistrict())
                .state(request.getState())
                .country(request.getCountry() != null ? request.getCountry() : "India")
                .pincode(request.getPincode())
                .upiId(request.getUpiId())
                .bankName(request.getBankName())
                .bankAccountNumber(request.getBankAccountNumber())
                .ifscCode(request.getIfscCode())
                .invoicePrefix(request.getInvoicePrefix() != null ? request.getInvoicePrefix() : "INV")
                .currency(request.getCurrency() != null ? request.getCurrency() : "₹")
                .taxPercentage(request.getTaxPercentage())
                .billFooter(request.getBillFooter())
                .receiptMessage(request.getReceiptMessage())
                .isActive(true)
                .build();

        Company saved = companyRepository.save(company);
        log.info("Company created: {}", saved.getCompanyName());

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && request.getPassword() != null && !request.getPassword().isBlank()
                && userRepository.count() == 0) {
            User user = User.builder()
                    .username(request.getUsername().trim())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role("ADMIN")
                    .build();
            userRepository.save(user);
            log.info("Admin user created: {}", request.getUsername());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));

        company.setCompanyName(request.getCompanyName());
        company.setOwnerName(request.getOwnerName());
        company.setShopType(request.getShopType());
        company.setGstNumber(request.getGstNumber());
        company.setPanNumber(request.getPanNumber());
        company.setPhoneNumber(request.getPhoneNumber());
        company.setAlternatePhone(request.getAlternatePhone());
        company.setEmail(request.getEmail());
        company.setWebsite(request.getWebsite());
        company.setAddressLine1(request.getAddressLine1());
        company.setAddressLine2(request.getAddressLine2());
        company.setCity(request.getCity());
        company.setDistrict(request.getDistrict());
        company.setState(request.getState());
        company.setCountry(request.getCountry());
        company.setPincode(request.getPincode());
        company.setUpiId(request.getUpiId());
        company.setBankName(request.getBankName());
        company.setBankAccountNumber(request.getBankAccountNumber());
        company.setIfscCode(request.getIfscCode());
        company.setInvoicePrefix(request.getInvoicePrefix());
        company.setCurrency(request.getCurrency());
        company.setTaxPercentage(request.getTaxPercentage());
        company.setBillFooter(request.getBillFooter());
        company.setReceiptMessage(request.getReceiptMessage());

        Company saved = companyRepository.save(company);
        log.info("Company updated: {}", saved.getCompanyName());

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && request.getPassword() != null && !request.getPassword().isBlank()
                && userRepository.count() == 0) {
            User user = User.builder()
                    .username(request.getUsername().trim())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role("ADMIN")
                    .build();
            userRepository.save(user);
            log.info("Admin user created: {}", request.getUsername());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse uploadLogo(Long companyId, MultipartFile file) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "id", companyId));

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf("."));
            }
            String filename = "logo" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            company.setLogo("/uploads/company/" + filename);
            Company saved = companyRepository.save(company);
            log.info("Company logo uploaded: {}", filename);
            return mapToResponse(saved);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload logo: " + e.getMessage(), e);
        }
    }

    private CompanyResponse mapToResponse(Company company) {
        return CompanyResponse.builder()
                .companyId(company.getCompanyId())
                .companyName(company.getCompanyName())
                .ownerName(company.getOwnerName())
                .shopType(company.getShopType())
                .gstNumber(company.getGstNumber())
                .panNumber(company.getPanNumber())
                .phoneNumber(company.getPhoneNumber())
                .alternatePhone(company.getAlternatePhone())
                .email(company.getEmail())
                .website(company.getWebsite())
                .addressLine1(company.getAddressLine1())
                .addressLine2(company.getAddressLine2())
                .city(company.getCity())
                .district(company.getDistrict())
                .state(company.getState())
                .country(company.getCountry())
                .pincode(company.getPincode())
                .logo(company.getLogo())
                .upiId(company.getUpiId())
                .bankName(company.getBankName())
                .bankAccountNumber(company.getBankAccountNumber())
                .ifscCode(company.getIfscCode())
                .invoicePrefix(company.getInvoicePrefix())
                .currency(company.getCurrency())
                .taxPercentage(company.getTaxPercentage())
                .billFooter(company.getBillFooter())
                .receiptMessage(company.getReceiptMessage())
                .isActive(company.getIsActive())
                .build();
    }
}
