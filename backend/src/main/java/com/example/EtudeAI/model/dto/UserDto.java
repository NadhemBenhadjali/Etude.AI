package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Role;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String keycloakUserId,
        String email,
        String firstname,
        String lastname,
        LocalDate birthDate,
        Level level,
        Integer elo,
        Role role,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {}
