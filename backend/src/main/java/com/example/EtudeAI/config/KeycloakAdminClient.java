package com.example.EtudeAI.config;

import com.example.EtudeAI.config.KeycloakProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class KeycloakAdminClient {

    private final WebClient keycloak;
    private final KeycloakProperties props;

    private volatile String cachedAdminToken;
    private volatile Instant adminTokenExpiry = Instant.EPOCH;

    /* ===== Admin token (service account: client_credentials) ===== */
    private String getAdminAccessToken() {
        if (cachedAdminToken != null && Instant.now().isBefore(adminTokenExpiry.minusSeconds(30))) {
            return cachedAdminToken;
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", props.getClientId());
        form.add("client_secret", props.getClientSecret());

        Map token = keycloak.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", props.getRealm())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        resp -> resp.bodyToMono(String.class)
                                .map(body -> new IllegalStateException("Admin token fetch failed: "
                                        + resp.statusCode() + " - " + body)))
                .bodyToMono(Map.class)
                .block();

        if (token == null || token.get("access_token") == null) {
            throw new IllegalStateException("Failed to get admin token from Keycloak");
        }

        cachedAdminToken = (String) token.get("access_token");
        Number expiresIn = (Number) token.getOrDefault("expires_in", 60);
        adminTokenExpiry = Instant.now().plusSeconds(expiresIn.longValue());
        return cachedAdminToken;
    }

    /* ===== User management ===== */

    public String createUser(String email, String firstname, String lastname, boolean emailVerified) {
        String adminToken = getAdminAccessToken();

        Map<String, Object> payload = Map.of(
                "username", email,
                "email", email,
                "firstName", firstname,
                "lastName", lastname,
                "enabled", true,
                "emailVerified", emailVerified
        );

        return keycloak.post()
                .uri("/admin/realms/{realm}/users", props.getRealm())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchangeToMono(resp -> {
                    if (resp.statusCode().is2xxSuccessful() || resp.statusCode().value() == 201) {
                        URI location = resp.headers().asHttpHeaders().getLocation();
                        String id = location != null ? location.getPath().replaceAll(".*/", "") : null;
                        return Mono.just(id);
                    } else if (resp.statusCode().value() == 409) {
                        return Mono.error(new IllegalStateException("Keycloak user already exists"));
                    }
                    return resp.bodyToMono(String.class).flatMap(body ->
                            Mono.error(new IllegalStateException("Keycloak create user failed: "
                                    + resp.statusCode() + " - " + body)));
                })
                .block();
    }

    public void setPassword(String userId, String rawPassword, boolean temporary) {
        String adminToken = getAdminAccessToken();
        Map<String, Object> cred = Map.of(
                "type", "password",
                "temporary", temporary,
                "value", rawPassword
        );
        keycloak.put()
                .uri("/admin/realms/{realm}/users/{id}/reset-password", props.getRealm(), userId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(cred)
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public void assignRealmRole(String userId, String roleName) {
        String adminToken = getAdminAccessToken();
        Map role = keycloak.get()
                .uri("/admin/realms/{realm}/roles/{role}", props.getRealm(), roleName)
                .header("Authorization", "Bearer " + adminToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        assert role != null;
        keycloak.post()
                .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", props.getRealm(), userId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(role))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    /* ===== Password grant for user login ===== */
    public Map exchangePasswordForToken(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", props.getClientId());
        form.add("client_secret", props.getClientSecret());
        form.add("username", username);
        form.add("password", password);
        form.add("scope", "openid");

        return keycloak.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", props.getRealm())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map fetchUserById(String userId) {
        String adminToken = getAdminAccessToken();
        return keycloak.get()
                .uri("/admin/realms/{realm}/users/{id}", props.getRealm(), userId)
                .header("Authorization", "Bearer " + adminToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
