package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
        private UUID id;
        private String keycloakUserId;
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        @NotBlank(message = "First name is required")
        private String firstname;
        @NotBlank(message = "Last name is required")
        private String lastname;
        private LocalDate birthDate;
        private Level level;
        private Integer elo;
        private Role role;
        private String avatar;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
        private Integer totalQuizzes;
        private Integer highestScore;
}
