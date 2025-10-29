package com.example.EtudeAI.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.NoteType;

@Entity
@Table(name = "note")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User must be specified")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoteType noteType;

    @NotBlank(message = "Content must not be blank")
    @Column(nullable = false)
    private String content;

    @NotNull(message = "Date must be specified")
    @Column(nullable = false)
    private ZonedDateTime date;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Level is required")
    @Column(nullable = false)
    private Level level;

    @NotBlank(message = "Subject cannot be blank")
    @Column(nullable = false)
    private String subject;

    @NotBlank(message = "Module cannot be blank")
    @Column(nullable = false)
    private String module;

    @NotBlank(message = "Lesson cannot be blank")
    @Column(nullable = false)
    private String lesson;
}
