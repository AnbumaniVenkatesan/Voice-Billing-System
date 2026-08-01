package com.example.billing.repository;

import com.example.billing.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRole(String role);

    List<User> findByCompanyId(Long companyId);
}
