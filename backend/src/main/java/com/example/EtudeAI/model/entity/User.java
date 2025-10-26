package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Keycloak ID must not be blank")
    private String keycloakId;

    @Column(nullable = false, unique = true)
    @Email(message = "Email must be valid")
    @NotBlank(message = "Email must not be blank")
    private String email;

    @Column(nullable = false)
    @NotBlank(message = "Firstname must not be blank")
    @Size(min = 2, max = 50, message = "Firstname must be between 2 and 50 characters")
    private String firstname;

    @Column(nullable = false)
    @NotBlank(message = "Lastname must not be blank")
    @Size(min = 2, max = 50, message = "Lastname must be between 2 and 50 characters")
    private String lastname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Role must be specified")
    private Role role;

    @Column(updatable = false, nullable = false)
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @Column(nullable = false)
    private ZonedDateTime updatedAt = ZonedDateTime.now();
}
