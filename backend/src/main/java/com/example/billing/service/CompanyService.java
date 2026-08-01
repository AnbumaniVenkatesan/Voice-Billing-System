package com.example.billing.service;

import com.example.billing.dto.request.CompanyRequest;
import com.example.billing.dto.response.CompanyResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface CompanyService {

    CompanyResponse getMyCompany();

    CompanyResponse getCompanyById(Long id);

    CompanyResponse setupCompany(CompanyRequest request);

    CompanyResponse saveCompany(CompanyRequest request);

    CompanyResponse updateCompany(Long id, CompanyRequest request);

    CompanyResponse uploadLogo(Long companyId, MultipartFile file);

    CompanyResponse removeLogo(Long companyId);

    List<CompanyResponse> getAllCompanies();

    CompanyResponse activateCompany(Long id);

    CompanyResponse deactivateCompany(Long id);

    void resetCompanyPassword(Long companyId, String newPassword);

    Map<String, Object> getCompanyStats(Long companyId);

    List<Map<String, Object>> getAllUsers();

    Map<String, Object> createUser(String username, String password, String role, Long companyId);

    void resetUserPassword(Long userId, String newPassword);

    void deactivateUser(Long userId);
}
