package com.example.EtudeAI.model.dto;

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
    private String module;
    private int score;
    private int totalQuestions;
}
