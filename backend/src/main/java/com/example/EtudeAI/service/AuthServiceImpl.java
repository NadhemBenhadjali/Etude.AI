package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.AuthResponse;
import com.example.EtudeAI.model.dto.LoginRequest;
import com.example.EtudeAI.model.dto.RegisterRequest;
import com.example.EtudeAI.model.dto.UserDto;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.repository.UserRepository;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.JWTParser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl  {

    private final UserRepository users;
    private final KeycloakAdminClient kc;


    @Transactional
    public UserDto register(RegisterRequest req) {
        users.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        });

        // 1) Create user in Keycloak
        boolean emailVerified = false; // switch to true if you don't use email verification flows
        String kcUserId = kc.createUser(req.getEmail(), req.getFirstname(), req.getLastname(), emailVerified);
        if (kcUserId == null || kcUserId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak did not return user id");
        }

        // 2) Set password & assign realm role
        kc.setPassword(kcUserId, req.getPassword(), false);
        kc.assignRealmRole(kcUserId, req.getRole().name());

        // 3) Persist in DB (never store password)
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(req.getEmail());
        user.setFirstname(req.getFirstname());
        user.setLastname(req.getLastname());
        user.setBirthDate(req.getBirthDate());
        user.setLevel(req.getLevel());
        user.setElo(req.getElo());
        user.setRole(req.getRole());
        user.setKeycloakUserId(kcUserId); // uncomment once column exists

        User saved = users.save(user);

        return toDto(saved, kcUserId);
    }


    @Transactional
    public AuthResponse login(LoginRequest req) {
        Map<String, Object> token = kc.exchangePasswordForToken(req.getEmail(), req.getPassword());
        String access = (String) token.get("access_token");
        if (access == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String refresh = (String) token.getOrDefault("refresh_token", "");
        String type    = (String) token.getOrDefault("token_type", "Bearer");
        Number exp     = (Number) token.getOrDefault("expires_in", 60);

        // Extract sub (Keycloak userId) from access token to update last_login
        String kcUserId;
        try {
            JWTClaimsSet claims = JWTParser.parse(access).getJWTClaimsSet();
            kcUserId = claims.getSubject();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot parse JWT", e);
        }

        // Update local record
        Optional<User> opt = users.findByKeycloakUserId(kcUserId) // when column exists
                .or(() -> users.findByEmail(req.getEmail()));     // fallback until migration
        User user = opt.orElseGet(() -> {
            // Fallback: create a minimal record by reading from KC (useful if user was pre-provisioned)
            Map kcUser = kc.fetchUserById(kcUserId);
            User u = new User();
            u.setId(UUID.randomUUID());
            u.setEmail((String) kcUser.get("email"));
            u.setFirstname((String) kcUser.getOrDefault("firstName", ""));
            u.setLastname((String) kcUser.getOrDefault("lastName", ""));
            // u.setKeycloakUserId(kcUserId); // uncomment after migration
            return users.save(u);
        });

        user.setUpdatedAt(ZonedDateTime.now());
        // consider adding lastLoginAt to entity in the future
        users.save(user);

        return AuthResponse.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .tokenType(type)
                .expiresIn(exp.longValue())
                .user(toDto(user, kcUserId))
                .build();
    }

    private static UserDto toDto(User user, String keycloakUserId) {
        return UserDto.builder()
                .id(user.getId())
                .keycloakUserId(keycloakUserId)
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .birthDate(user.getBirthDate())
                .level(user.getLevel())
                .elo(user.getElo())
                .role(user.getRole())
                .build();
    }
}
