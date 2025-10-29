package com.example.EtudeAI.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class MeController {
    @GetMapping("/api/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof OidcUser user) {
            return Map.of(
                    "sub", user.getSubject(),
                    "username", user.getPreferredUsername(),
                    "email", user.getEmail(),
                    "roles", auth.getAuthorities().stream().map(Object::toString).toList()
            );
        }
        return Map.of("anonymous", true);
    }
}
