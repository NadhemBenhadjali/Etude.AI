package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "session")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User must be specified")
    private User user;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    @NotNull(message = "Course must be specified")
    private Course course;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Status is required")
    @Column(nullable = false)
    private Status status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(nullable = true, updatable = true)
    private ZonedDateTime startedAt;

    @Column(nullable = true, updatable = true)
    private ZonedDateTime completedAt;

    @ElementCollection
    @CollectionTable(name = "session_summary_points", joinColumns = @JoinColumn(name = "session_id"))
    @Column(nullable = false)
    @OrderColumn(name = "idx")
    private List<String> summaryPointsOfFocus;

    @ElementCollection
    @CollectionTable(name = "session_quiz_points", joinColumns = @JoinColumn(name = "session_id"))
    @Column(nullable = false)
    @OrderColumn(name = "idx")
    private List<String> quizPointsOfFocus;

    @Min(value = 0, message = "Quiz score cannot be negative")
    @Max(value = 10, message = "Quiz score cannot exceed 10")
    private Integer quizScore;

    @Lob
    private String summary;

    @Lob
    private String sessionFeedback;

    @Lob
    private String lessonContent;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "session_id")
    @OrderColumn(name = "idx")
    private List<QuizElement> quizElements;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "session_id")
    @OrderColumn(name = "idx")
    private List<QnAElement> qnaElements;
}
