package com.example.billing.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaytmConfig {

    @Value("${paytm.merchant-id}")
    private String merchantId;

    @Value("${paytm.merchant-key}")
    private String merchantKey;

    @Value("${paytm.merchant-website}")
    private String merchantWebsite;

    @Value("${paytm.callback-url}")
    private String callbackUrl;

    public String getMerchantId() {
        return merchantId;
    }

    public String getMerchantKey() {
        return merchantKey;
    }

    public String getMerchantWebsite() {
        return merchantWebsite;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }
}
