// src/main/java/com/example/EtudeAI/model/dto/LoginRequest.java
package com.example.EtudeAI.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @Email @NotBlank private String email;
    @NotBlank private String password;
}
