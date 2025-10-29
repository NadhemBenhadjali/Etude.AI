package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.QuizType;

import java.util.List;
import java.util.UUID;

public record QuizElementDTO(
        UUID id,
        QuizType quizType,
        String question,
        List<String> options,
        String answer,
        Boolean answered
) {}
