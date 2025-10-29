package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String keycloakUserId;
    private String email;
    private String firstname;
    private String lastname;
    private LocalDate birthDate;
    private Level level;
    private Integer elo;
    private Role role;
}
