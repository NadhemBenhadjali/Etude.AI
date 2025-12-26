package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.Status;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public record SessionDTO(
                UUID id,
                Level level,
                String subject,
                String module,
                String lesson,
                Status status,
                ZonedDateTime createdAt,
                ZonedDateTime startedAt,
                ZonedDateTime completedAt,
                List<String> summaryPointsOfFocus,
                List<String> quizPointsOfFocus,
                Integer quizScore,
                String summary,
                String sessionFeedback,
                String lessonContent,
                List<QuizElementDTO> quizElements,
                List<QnAElementDTO> qnaElements) {
}
