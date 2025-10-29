package com.example.EtudeAI.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

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

    @NotBlank(message = "Content must not be blank")
    @Column(nullable = false)
    private String content;

    @NotNull(message = "Date must be specified")
    @Column(nullable = false)
    private ZonedDateTime date;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    @NotNull(message = "Course must be specified")
    private Course course;
}
