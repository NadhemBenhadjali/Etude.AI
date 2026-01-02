package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.SessionType;
import com.example.EtudeAI.model.enums.Status;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * DTO for partial session updates.
 * All fields are optional - only non-null fields will be updated.
 */
@Data
public class SessionUpdateDTO {
    private Status status;
    private SessionType sessionType;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private ZonedDateTime startedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private ZonedDateTime completedAt;

    private List<String> summaryPointsOfFocus;
    private List<String> quizPointsOfFocus;
    private Integer quizScore;
    private String summary;
    private String sessionFeedback;
    private String lessonContent;
    private List<QuizElementDTO> quizElements;
    private List<QnAElementDTO> qnaElements;
    private List<SummaryElementDTO> summaryElements;
}

