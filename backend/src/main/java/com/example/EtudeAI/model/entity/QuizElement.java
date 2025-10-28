package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.QuizType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_element")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizType type;

    @NotBlank
    @Column(nullable = false)
    private String question;

    // Store options in a separate collection table
    @ElementCollection
    @CollectionTable(
            name = "quiz_element_options",
            joinColumns = @JoinColumn(name = "quiz_element_id")
    )
    @Column(name = "option_value", nullable = false)
    @OrderColumn(name = "idx")
    private List<String> options = new ArrayList<>();

    @NotBlank
    @Column(nullable = false)
    private String answer;

    @Column(nullable = false)
    private Boolean answered = Boolean.FALSE;
}
