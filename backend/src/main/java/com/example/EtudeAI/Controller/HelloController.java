package com.example.EtudeAI.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public Map<String, Object> hello(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
                "message", "Hello, authenticated user!",
                "sub", jwt.getSubject(),
                "preferred_username", jwt.getClaimAsString("preferred_username"),
                "roles", jwt.getClaimAsMap("realm_access")
        );
    }

    @GetMapping("/api/admin/panel")
    public Map<String, Object> admin(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
                "message", "Hello, admin!",
                "user", jwt.getClaimAsString("preferred_username")
        );
    }
}
