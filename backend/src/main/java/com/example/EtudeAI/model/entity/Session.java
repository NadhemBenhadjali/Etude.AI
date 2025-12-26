package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Level;
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
    @Max(value = 100, message = "Quiz score cannot exceed 100")
    private Integer quizScore;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String sessionFeedback;

    @Column(columnDefinition = "TEXT")
    private String lessonContent;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "idx")
    private List<QuizElement> quizElements;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "idx")
    private List<QnAElement> qnaElements;

    public void addQuizElement(QuizElement element) {
        if (quizElements == null) {
            quizElements = new java.util.ArrayList<>();
        }
        quizElements.add(element);
        element.setSession(this);
    }

    public void addQnAElement(QnAElement element) {
        if (qnaElements == null) {
            qnaElements = new java.util.ArrayList<>();
        }
        qnaElements.add(element);
        element.setSession(this);
    }
}
