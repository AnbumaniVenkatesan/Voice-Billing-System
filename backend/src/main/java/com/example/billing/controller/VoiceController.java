package com.example.billing.controller;

import com.example.billing.dto.request.VoiceAliasRequest;
import com.example.billing.dto.request.VoiceRequest;
import com.example.billing.dto.response.VoiceResponse;
import com.example.billing.service.VoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceController {

    private final VoiceService voiceService;

    @PostMapping("/process")
    public ResponseEntity<VoiceResponse> processVoiceCommand(@Valid @RequestBody VoiceRequest request) {
        long start = System.currentTimeMillis();

        VoiceResponse response = voiceService.processVoiceCommand(request);

        long elapsed = System.currentTimeMillis() - start;
        int matched = response.getMatchedItems() != null ? response.getMatchedItems().size() : 0;
        int unmatched = response.getUnmatchedItems() != null ? response.getUnmatchedItems().size() : 0;

        log.info("[API] POST /api/voice/process — {}ms | matched: {} | unmatched: {}",
                elapsed, matched, unmatched);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/alias")
    public ResponseEntity<Map<String, String>> saveVoiceAlias(@Valid @RequestBody VoiceAliasRequest request) {
        log.info("[API] POST /api/voice/alias — '{}' → product {}",
                request.getSpokenText(), request.getProductId());

        voiceService.saveVoiceAlias(request.getSpokenText(), request.getProductId());

        return ResponseEntity.ok(Map.of("message", "Alias saved successfully"));
    }
}
