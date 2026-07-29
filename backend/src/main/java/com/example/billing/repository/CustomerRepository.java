package com.example.billing.repository;

import com.example.billing.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByCustomerNameContainingIgnoreCase(String name);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}
