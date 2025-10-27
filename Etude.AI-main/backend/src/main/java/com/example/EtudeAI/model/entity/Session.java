package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User must be specified")
    private User user;

    @Column(nullable = false)
    @NotBlank(message = "Subject must not be blank")
    private String subject;

    @Column(nullable = false)
    @NotBlank(message = "Module must not be blank")
    private String module;

    @Column(nullable = false)
    @NotBlank(message = "Lesson must not be blank")
    private String lesson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Status must be specified")
    private Status status = Status.PENDING;

    @Column(updatable = false, nullable = false)
    private ZonedDateTime createdAt = ZonedDateTime.now();

    private ZonedDateTime startedAt;

    private ZonedDateTime completedAt;

    @ElementCollection
    @CollectionTable(name = "session_main_points", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "main_point")
    private List<String> mainPoints;

    @ElementCollection
    @CollectionTable(name = "session_quiz_evaluation", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "quiz_evaluation")
    private List<String> quizEvaluation;

    @Min(value = 0, message = "Quiz score must be >= 0")
    @Max(value = 10, message = "Quiz score must be <= 10")
    private Integer quizScore;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String report;
}
