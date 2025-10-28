// src/main/java/com/example/EtudeAI/config/KeycloakProperties.java
package com.example.EtudeAI.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "keycloak")
public class KeycloakProperties {
    private String baseUrl;
    private String realm;

    // Admin login to call Admin REST (you chose B: admin username/password)
    private String adminUsername;
    private String adminPassword;

    // API client used for password grant login
    private String clientId;
    private String clientSecret;
}
