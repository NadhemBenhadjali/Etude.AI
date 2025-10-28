package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "User ID is required")
    @Column(nullable = false)
    private UUID userId;

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

    private ZonedDateTime startedAt;
    
    private ZonedDateTime completedAt;

    @ElementCollection
    @CollectionTable(
            name = "session_summary_points",
            joinColumns = @JoinColumn(name = "session_id")
    )
    @Column(name = "point")
    private List<@NotBlank(message = "Summary point cannot be blank") String> summaryPointsOfFocus;

    @ElementCollection
    @CollectionTable(
            name = "session_quiz_points",
            joinColumns = @JoinColumn(name = "session_id")
    )
    @Column(name = "point")
    private List<@NotBlank(message = "Quiz point cannot be blank") String> quizPointsOfFocus;

    @Min(value = 0, message = "Quiz score cannot be negative")
    @Max(value = 10, message = "Quiz score cannot exceed 10")
    private Integer quizScore;

    @Lob
    private String summary;

    @Lob
    private String sessionFeedback;

    @Lob
    private String lessonContent;

    @ElementCollection
    @CollectionTable(
            name = "session_quiz_elements",
            joinColumns = @JoinColumn(name = "session_id")
    )
    @MapKeyColumn(name = "question")
    @Column(name = "correct_answer")
    private Map<String, String> quizElements;

    @ElementCollection
    @CollectionTable(
            name = "session_qna_elements",
            joinColumns = @JoinColumn(name = "session_id")
    )
    @MapKeyColumn(name = "user_question")
    @Column(name = "agent_response")
    private Map<String, String> qnaElements;
}
