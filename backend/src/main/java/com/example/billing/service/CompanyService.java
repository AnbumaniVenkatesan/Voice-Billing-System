package com.example.billing.service;

import com.example.billing.dto.request.CompanyRequest;
import com.example.billing.dto.response.CompanyResponse;
import org.springframework.web.multipart.MultipartFile;

public interface CompanyService {

    CompanyResponse getActiveCompany();

    CompanyResponse saveCompany(CompanyRequest request);

    CompanyResponse updateCompany(Long id, CompanyRequest request);

    CompanyResponse uploadLogo(Long companyId, MultipartFile file);
}
