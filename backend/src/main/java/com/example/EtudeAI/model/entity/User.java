package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Role;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "client")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keycloak_user_id", unique = true, nullable = false, length = 36)
    private String keycloakUserId;

    @Email(message = "Email must be a valid address")
    @NotBlank(message = "Email cannot be blank")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "First name cannot be blank")
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    @Pattern(regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ\\-\\s]+$", message = "First name can only contain letters, spaces, or hyphens")
    @Column(nullable = false)
    private String firstname;

    @NotBlank(message = "Last name cannot be blank")
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    @Pattern(regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ\\-\\s]+$", message = "Last name can only contain letters, spaces, or hyphens")
    @Column(nullable = false)
    private String lastname;

    @Past(message = "Birth date must be in the past")
    @NotNull(message = "Birth date is required")
    @Column(nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Level is required")
    @Column(nullable = false)
    private Level level;

    @NotNull(message = "Elo is required")
    @Min(value = 0, message = "Elo cannot be negative")
    @Column(nullable = false)
    private Integer elo;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Role is required")
    @Column(nullable = false)
    private Role role;

    @Column(length = 255)
    private String avatar;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private ZonedDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Session> sessions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> notes;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalQuizzes = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer highestScore = 0;

    @Column(name = "total_qna", nullable = false)
    @Builder.Default
    private Integer totalQna = 0;

    @Column(name = "total_summaries", nullable = false)
    @Builder.Default
    private Integer totalSummaries = 0;

    
}
