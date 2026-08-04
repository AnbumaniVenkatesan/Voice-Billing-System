package com.example.billing.service.impl;

import com.example.billing.config.CurrentUserProvider;
import com.example.billing.dto.request.CompanyRequest;
import com.example.billing.dto.response.CompanyResponse;
import com.example.billing.entity.Company;
import com.example.billing.entity.User;
import com.example.billing.exception.ResourceNotFoundException;
import com.example.billing.repository.CompanyRepository;
import com.example.billing.repository.InvoiceRepository;
import com.example.billing.repository.ProductRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final InvoiceRepository invoiceRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;

    @Value("${app.upload.dir:uploads/company}")
    private String uploadDir;

    private Company requireCompany(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));
    }

    private void checkSuperAdmin() {
        if (!currentUserProvider.isSuperAdmin()) {
            throw new SecurityException("Access denied: super admin only");
        }
    }

    private CompanyResponse defaultResponse() {
        return CompanyResponse.builder()
                .companyName("Smart Billing System")
                .currency("₹")
                .invoicePrefix("INV")
                .build();
    }

    @Override
    public CompanyResponse getMyCompany() {
        Long cid = currentUserProvider.getCompanyId();
        if (cid == null) {
            return defaultResponse();
        }
        return companyRepository.findById(cid)
                .map(this::mapToResponse)
                .orElseGet(this::defaultResponse);
    }

    @Override
    public CompanyResponse getCompanyById(Long id) {
        checkSuperAdmin();
        return mapToResponse(requireCompany(id));
    }

    @Override
    @Transactional
    public CompanyResponse setupCompany(CompanyRequest request) {
        if (userRepository.count() > 0) {
            throw new IllegalStateException("Setup already completed");
        }

        Company company = buildCompany(request);
        company.setIsActive(true);
        Company saved = companyRepository.save(company);
        log.info("Company created during setup: {}", saved.getCompanyName());

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && request.getPassword() != null && !request.getPassword().isBlank()) {
            User admin = User.builder()
                    .username(request.getUsername().trim())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role("ADMIN")
                    .companyId(saved.getCompanyId())
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            log.info("Admin user created during setup: {}", admin.getUsername());
        }

        if (request.getSuperAdminUsername() != null && !request.getSuperAdminUsername().isBlank()
                && request.getSuperAdminPassword() != null && !request.getSuperAdminPassword().isBlank()) {
            User superAdmin = User.builder()
                    .username(request.getSuperAdminUsername().trim())
                    .password(passwordEncoder.encode(request.getSuperAdminPassword()))
                    .role("SUPER_ADMIN")
                    .isActive(true)
                    .build();
            userRepository.save(superAdmin);
            log.info("Super admin user created during setup: {}", superAdmin.getUsername());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse saveCompany(CompanyRequest request) {
        checkSuperAdmin();

        Company company = buildCompany(request);
        company.setIsActive(true);
        Company saved = companyRepository.save(company);
        log.info("Company created by super admin: {}", saved.getCompanyName());

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && request.getPassword() != null && !request.getPassword().isBlank()) {
            if (userRepository.existsByUsername(request.getUsername().trim())) {
                throw new IllegalArgumentException("Username already exists: " + request.getUsername().trim());
            }
            User admin = User.builder()
                    .username(request.getUsername().trim())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role("ADMIN")
                    .companyId(saved.getCompanyId())
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            log.info("Admin user created for company {}: {}", saved.getCompanyId(), admin.getUsername());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        Company company = requireCompany(id);

        if (!currentUserProvider.isSuperAdmin()
                && (company.getCompanyId() == null
                    || !company.getCompanyId().equals(currentUserProvider.getCompanyId()))) {
            throw new SecurityException("Access denied");
        }

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
        company.setPaymentGateway(request.getPaymentGateway());
        company.setGatewayMerchantId(request.getGatewayMerchantId());
        company.setGatewayMerchantKey(request.getGatewayMerchantKey());
        company.setInvoicePrefix(request.getInvoicePrefix());
        company.setCurrency(request.getCurrency());
        company.setTaxPercentage(request.getTaxPercentage());
        company.setBillFooter(request.getBillFooter());
        company.setReceiptMessage(request.getReceiptMessage());
        company.setInvoiceHeader(request.getInvoiceHeader());
        company.setInvoiceFooter(request.getInvoiceFooter());

        Company saved = companyRepository.save(company);
        log.info("Company updated: {}", saved.getCompanyName());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse uploadLogo(Long companyId, MultipartFile file) {
        Company company = requireCompany(companyId);

        if (!currentUserProvider.isSuperAdmin()
                && (company.getCompanyId() == null
                    || !company.getCompanyId().equals(currentUserProvider.getCompanyId()))) {
            throw new SecurityException("Access denied");
        }

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

    @Override
    @Transactional
    public CompanyResponse removeLogo(Long companyId) {
        Company company = requireCompany(companyId);

        if (!currentUserProvider.isSuperAdmin()
                && (company.getCompanyId() == null
                    || !company.getCompanyId().equals(currentUserProvider.getCompanyId()))) {
            throw new SecurityException("Access denied");
        }

        String logo = company.getLogo();
        company.setLogo(null);
        Company saved = companyRepository.save(company);

        if (logo != null && logo.startsWith("/uploads/")) {
            try {
                String filename = logo.substring(logo.lastIndexOf('/') + 1);
                Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
                Files.deleteIfExists(filePath);
                log.info("Logo file deleted: {}", filename);
            } catch (IOException e) {
                log.warn("Failed to delete logo file: {}", e.getMessage());
            }
        }
        log.info("Company logo removed: {}", companyId);
        return mapToResponse(saved);
    }

    @Override
    public List<CompanyResponse> getAllCompanies() {
        checkSuperAdmin();
        return companyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CompanyResponse activateCompany(Long id) {
        checkSuperAdmin();
        Company company = requireCompany(id);
        company.setIsActive(true);
        return mapToResponse(companyRepository.save(company));
    }

    @Override
    @Transactional
    public CompanyResponse deactivateCompany(Long id) {
        checkSuperAdmin();
        Company company = requireCompany(id);
        if (company.getIsActive() != null && company.getIsActive()) {
            long activeOthers = companyRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                    .filter(c -> !c.getCompanyId().equals(id))
                    .count();
            if (activeOthers == 0) {
                throw new IllegalArgumentException("Cannot deactivate the last active company");
            }
        }
        company.setIsActive(false);
        return mapToResponse(companyRepository.save(company));
    }

    @Override
    @Transactional
    public void deleteCompany(Long companyId) {
        checkSuperAdmin();
        Company company = requireCompany(companyId);

        List<User> users = userRepository.findByCompanyId(companyId);
        if (!users.isEmpty()) {
            userRepository.deleteAll(users);
        }

        String logo = company.getLogo();
        companyRepository.delete(company);
        log.info("Company deleted: {}", company.getCompanyName());

        if (logo != null && logo.startsWith("/uploads/")) {
            try {
                String filename = logo.substring(logo.lastIndexOf('/') + 1);
                Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
                Files.deleteIfExists(filePath);
                log.info("Logo file deleted: {}", filename);
            } catch (IOException e) {
                log.warn("Failed to delete logo file: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void resetCompanyPassword(Long companyId, String newPassword) {
        checkSuperAdmin();
        requireCompany(companyId);
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }
        List<User> admins = userRepository.findByCompanyId(companyId).stream()
                .filter(u -> "ADMIN".equals(u.getRole()))
                .collect(Collectors.toList());
        if (admins.isEmpty()) {
            throw new ResourceNotFoundException("Admin user", "companyId", companyId);
        }
        for (User admin : admins) {
            admin.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(admin);
        }
        log.info("Password reset for admin(s) of company {}", companyId);
    }

    @Override
    public Map<String, Object> getCompanyStats(Long companyId) {
        checkSuperAdmin();
        requireCompany(companyId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("companyId", companyId);
        stats.put("products", productRepository.findByCompanyId(companyId).size());
        stats.put("invoices", invoiceRepository.findByCompanyId(companyId).size());
        stats.put("users", userRepository.findByCompanyId(companyId).size());
        return stats;
    }

    @Override
    public List<Map<String, Object>> getAllUsers() {
        checkSuperAdmin();
        return userRepository.findAll().stream()
                .map(this::mapUser)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> createUser(String username, String password, String role, Long companyId) {
        checkSuperAdmin();
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (userRepository.existsByUsername(username.trim())) {
            throw new IllegalArgumentException("Username already exists: " + username.trim());
        }

        String normalizedRole = role != null ? role.toUpperCase() : "ADMIN";
        if (!"ADMIN".equals(normalizedRole) && !"SUPER_ADMIN".equals(normalizedRole)) {
            throw new IllegalArgumentException("Role must be ADMIN or SUPER_ADMIN");
        }
        if ("ADMIN".equals(normalizedRole)) {
            requireCompany(companyId);
        } else {
            companyId = null;
        }

        User user = User.builder()
                .username(username.trim())
                .password(passwordEncoder.encode(password))
                .role(normalizedRole)
                .companyId(companyId)
                .isActive(true)
                .build();
        User saved = userRepository.save(user);
        log.info("User created by super admin: {} ({})", saved.getUsername(), saved.getRole());
        return mapUser(saved);
    }

    @Override
    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        checkSuperAdmin();
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password reset for user {}", user.getUsername());
    }

    @Override
    @Transactional
    public void deactivateUser(Long userId) {
        checkSuperAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if ("SUPER_ADMIN".equals(user.getRole())) {
            long superAdmins = userRepository.findAll().stream()
                    .filter(u -> "SUPER_ADMIN".equals(u.getRole()) && Boolean.TRUE.equals(u.getIsActive()))
                    .count();
            if (superAdmins <= 1) {
                throw new IllegalArgumentException("Cannot deactivate the last super admin");
            }
        }
        if (user.getUserId().equals(currentUserProvider.getUserId())) {
            throw new IllegalArgumentException("Cannot deactivate your own account");
        }
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getUsername());
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        checkSuperAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if ("SUPER_ADMIN".equals(user.getRole())) {
            long superAdmins = userRepository.findAll().stream()
                    .filter(u -> "SUPER_ADMIN".equals(u.getRole()) && Boolean.TRUE.equals(u.getIsActive()))
                    .count();
            if (superAdmins <= 1) {
                throw new IllegalArgumentException("Cannot delete the last super admin");
            }
        }
        if (user.getUserId().equals(currentUserProvider.getUserId())) {
            throw new IllegalArgumentException("Cannot delete your own account");
        }
        userRepository.delete(user);
        log.info("User deleted: {}", user.getUsername());
    }

    private Company buildCompany(CompanyRequest request) {
        return Company.builder()
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
                .paymentGateway(request.getPaymentGateway())
                .gatewayMerchantId(request.getGatewayMerchantId())
                .gatewayMerchantKey(request.getGatewayMerchantKey())
                .invoicePrefix(request.getInvoicePrefix() != null ? request.getInvoicePrefix() : "INV")
                .currency(request.getCurrency() != null ? request.getCurrency() : "₹")
                .taxPercentage(request.getTaxPercentage())
                .billFooter(request.getBillFooter())
                .receiptMessage(request.getReceiptMessage())
                .invoiceHeader(request.getInvoiceHeader())
                .invoiceFooter(request.getInvoiceFooter())
                .build();
    }

    private Map<String, Object> mapUser(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("userId", user.getUserId());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole());
        userMap.put("companyId", user.getCompanyId());
        userMap.put("isActive", user.getIsActive());
        userMap.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        return userMap;
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
                .paymentGateway(company.getPaymentGateway())
                .gatewayMerchantId(company.getGatewayMerchantId())
                .gatewayMerchantKey(company.getGatewayMerchantKey())
                .invoicePrefix(company.getInvoicePrefix())
                .currency(company.getCurrency())
                .taxPercentage(company.getTaxPercentage())
                .billFooter(company.getBillFooter())
                .receiptMessage(company.getReceiptMessage())
                .invoiceHeader(company.getInvoiceHeader())
                .invoiceFooter(company.getInvoiceFooter())
                .isActive(company.getIsActive())
                .build();
    }
}
