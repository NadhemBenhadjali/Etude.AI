package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "sessions")
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

    @Column()
    private ZonedDateTime startedAt;

    @Column()
    private ZonedDateTime completedAt;

    @ElementCollection
    @CollectionTable(name = "session_summary_points", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "point", nullable = false)
    @OrderColumn(name = "idx")
    private List<String> summaryPointsOfFocus = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "session_quiz_points", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "quiz_point", nullable = false)
    @OrderColumn(name = "idx")
    private List<String> quizPointsOfFocus = new ArrayList<>();

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
    @JoinColumn(name = "session_id") // FK lives on child table
    @OrderColumn(name = "idx")
    private List<QuizElement> quizElements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "session_qna", joinColumns = @JoinColumn(name = "session_id"))
    @OrderColumn(name = "idx")
    private List<QAElement> qnaElements = new ArrayList<>();
}
