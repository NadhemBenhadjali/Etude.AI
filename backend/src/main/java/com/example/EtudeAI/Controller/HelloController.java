package com.example.EtudeAI.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public Map<String, Object> hello(Authentication auth) {
        if (auth == null) return Map.of("message", "Hello, anonymous!");
        Object p = auth.getPrincipal();

        if (p instanceof Jwt jwt) {
            return Map.of(
                    "message", "Hello, authenticated user (JWT)!",
                    "sub", jwt.getSubject(),
                    "preferred_username", jwt.getClaimAsString("preferred_username"),
                    "roles", jwt.getClaimAsMap("realm_access")
            );
        } else if (p instanceof OidcUser user) {
            return Map.of(
                    "message", "Hello, authenticated user (OIDC session)!",
                    "sub", user.getSubject(),
                    "preferred_username", user.getPreferredUsername(),
                    "email", user.getEmail(),
                    "roles", auth.getAuthorities().stream().map(Object::toString).toList()
            );
        }
        return Map.of("message", "Hello!", "principal", p.toString());
    }

    @GetMapping("/api/admin/panel")
    public Map<String, Object> admin(Authentication auth) {
        Object username =
                (auth != null && auth.getPrincipal() instanceof OidcUser u) ? u.getPreferredUsername()
                        : (auth != null && auth.getPrincipal() instanceof Jwt j) ? j.getClaimAsString("preferred_username")
                        : "unknown";
        return Map.of("message", "Hello, admin!", "user", username);
    }
}
