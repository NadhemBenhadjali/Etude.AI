package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import java.util.Date;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String keycloakId,
        String email,
        String firstname,
        String lastname,
        String phoneNumber,
        Date birthDate,
        Level level,
        Integer elo,
        String createdAt,
        String updatedAt
) {}
