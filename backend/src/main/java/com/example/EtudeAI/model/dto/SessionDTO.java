package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Status;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public record SessionDTO(
        UUID id,
        UUID userId,
        String subject,
        String module,
        String lesson,
        Status status,
        ZonedDateTime createdAt,
        ZonedDateTime startedAt,
        ZonedDateTime completedAt,
        List<String> mainPoints,
        List<String> quizEvaluation,
        Integer quizScore,
        String report
) {}
