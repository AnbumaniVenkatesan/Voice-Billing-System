package com.example.billing.config;

import com.example.billing.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return user;
    }

    public Long getUserId() {
        User user = getCurrentUser();
        return user == null ? null : user.getUserId();
    }

    public String getRole() {
        User user = getCurrentUser();
        return user == null ? null : user.getRole();
    }

    public Long getCompanyId() {
        User user = getCurrentUser();
        return user == null ? null : user.getCompanyId();
    }

    public boolean isSuperAdmin() {
        User user = getCurrentUser();
        return user != null && "SUPER_ADMIN".equals(user.getRole());
    }
}
