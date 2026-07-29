package com.example.billing.config;

import com.example.billing.entity.Company;
import com.example.billing.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CompanyRepository companyRepository;

    @Override
    public void run(String... args) {
        if (!companyRepository.existsByIsActiveTrue()) {
            Company company = Company.builder()
                    .companyName("My Shop")
                    .invoicePrefix("INV")
                    .currency("₹")
                    .isActive(true)
                    .build();
            companyRepository.save(company);
            log.info("Default empty company created. Please configure in Company Settings.");
        }
    }
}
