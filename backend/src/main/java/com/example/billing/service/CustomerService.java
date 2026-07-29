package com.example.billing.service;

import com.example.billing.dto.request.CustomerRequest;
import com.example.billing.dto.response.CustomerResponse;
import java.util.List;

public interface CustomerService {

    CustomerResponse createCustomer(CustomerRequest request);

    List<CustomerResponse> getAllCustomers();

    CustomerResponse getCustomerById(Long id);

    CustomerResponse updateCustomer(Long id, CustomerRequest request);

    void deleteCustomer(Long id);
}
