package com.example.EtudeAI.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class MeController {
    @GetMapping("/api/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null) return Map.of("anonymous", true);
        Object p = auth.getPrincipal();
        if (p instanceof Jwt jwt) {
            return Map.of(
                    "sub", jwt.getSubject(),
                    "username", jwt.getClaimAsString("preferred_username"),
                    "email", jwt.getClaimAsString("email"),
                    "roles", auth.getAuthorities().stream().map(Object::toString).toList()
            );
        } else if (p instanceof OidcUser user) {
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
