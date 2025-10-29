package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.QuizType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quiz_element")
@Builder
@Getter
@Setter
@NoArgsConstructor 
@AllArgsConstructor
public class QuizElement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizType quizType;

    @NotBlank
    @Column(nullable = false)
    private String question;

    @ElementCollection
    @CollectionTable(name = "quiz_element_options", joinColumns = @JoinColumn(name = "quiz_element_id"))
    @Column(name = "option_value", nullable = false)
    private List<String> options;

    @NotBlank
    @Column(nullable = false)
    private String answer;

    @Column(nullable = false)
    private Boolean answered;
}
