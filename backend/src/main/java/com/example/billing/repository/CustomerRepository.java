package com.example.billing.repository;

import com.example.billing.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByCustomerNameContainingIgnoreCaseAndCompanyId(String name, Long companyId);

    boolean existsByPhoneAndCompanyId(String phone, Long companyId);

    boolean existsByEmailAndCompanyId(String email, Long companyId);

    List<Customer> findByCompanyId(Long companyId);
}
