package com.example.EtudeAI.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmissionDTO {
    private String sessionId; // Optional, if we want to link it

    @NotBlank(message = "Module is required")
    private String module;

    @Min(value = 0, message = "Score must be non-negative")
    private int score;

    @Min(value = 1, message = "Total questions must be at least 1")
    private int totalQuestions;
}
