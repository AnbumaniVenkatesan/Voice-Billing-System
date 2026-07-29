package com.example.billing.service;

import com.example.billing.dto.request.VoiceRequest;
import com.example.billing.dto.response.VoiceResponse;

public interface VoiceService {

    VoiceResponse processVoiceCommand(VoiceRequest request);

    void saveVoiceAlias(String spokenText, Long productId);
}
