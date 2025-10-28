// src/main/java/com/example/EtudeAI/model/dto/RegisterRequest.java
package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 8, max = 200) private String password;

    @NotBlank @Size(max = 50) private String firstname;
    @NotBlank @Size(max = 50) private String lastname;

    @NotNull @Past private LocalDate birthDate;

    @NotNull private Level level;
    @NotNull @Min(0) private Integer elo;

    @NotNull private Role role;
}
