package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Level;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

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

    @Column(length = 15)
    @Size(min = 6, max = 15, message = "Phone number must be between 6 and 15 digits")
    @Pattern(regexp = "^[0-9]*$", message = "Phone number must contain only digits")
    private String phoneNumber;

    @Temporal(TemporalType.DATE)
    @NotNull(message = "Birth date must be specified")
    private Date birthDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Level must be specified")
    private Level level;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> strongPoints;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> weakPoints;

    @Column(nullable = false)
    @Min(value = 0, message = "ELO must be greater than or equal to 0")
    private Integer elo;

    @Column(updatable = false, nullable = false)
    private ZonedDateTime createdAt;

    @Column(nullable = false)
    private ZonedDateTime updatedAt;
}
