// src/main/java/com/example/EtudeAI/model/dto/AuthResponse.java
package com.example.EtudeAI.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;     // "Bearer"
    private long   expiresIn;     // seconds
    private UserDto user;
}
