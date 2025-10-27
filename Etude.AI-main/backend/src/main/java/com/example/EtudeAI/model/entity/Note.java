package com.example.EtudeAI.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Date;
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

    @Column(nullable = false)
    @NotBlank(message = "Content must not be blank")
    private String content;

    @Temporal(TemporalType.DATE)
    @Column(nullable = false)
    @NotNull(message = "Date must be specified")
    private Date date;

    @Column(nullable = false)
    @NotBlank(message = "Subject must not be blank")
    private String subject;

    @Column(nullable = false)
    @NotBlank(message = "Module must not be blank")
    private String module;

    @Column(nullable = false)
    @NotBlank(message = "Lesson must not be blank")
    private String lesson;
}
