package com.example.EtudeAI.service.helper;

import com.example.EtudeAI.model.dto.QuizElementDTO;
import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.QuizElement;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.SessionType;
import org.springframework.stereotype.Component;

/**
 * Handler for QUIZ session type.
 * Processes quiz-specific fields and quiz elements.
 */
@Component
public class QuizSessionHandler implements SessionTypeHandler {

    @Override
    public boolean supports(SessionType sessionType) {
        return sessionType == SessionType.QUIZ;
    }

    @Override
    public void handle(Session session, SessionDTO sessionDTO, User user) {
        // Set quiz-specific fields
        session.setQuizPointsOfFocus(sessionDTO.quizPointsOfFocus());
        session.setQuizScore(sessionDTO.quizScore());

        // Clear other type-specific data (SRP: this handler owns only quiz logic)
        session.setSummaryPointsOfFocus(null);
        session.setSummary(null);
        clearQnaElements(session);
        clearSummaryElements(session);

        // Handle Quiz Elements
        handleQuizElements(session, sessionDTO);
    }

    private void handleQuizElements(Session session, SessionDTO sessionDTO) {
        if (sessionDTO.quizElements() != null) {
            if (session.getQuizElements() != null) {
                session.getQuizElements().clear();
            }
            for (QuizElementDTO qDTO : sessionDTO.quizElements()) {
                QuizElement qe = QuizElement.builder()
                        .quizType(qDTO.quizType())
                        .question(qDTO.question())
                        .options(qDTO.options())
                        .answer(qDTO.answer())
                        .answered(qDTO.answered())
                        .build();
                session.addQuizElement(qe);
            }
        }
    }

    private void clearQnaElements(Session session) {
        if (session.getQnaElements() != null) {
            session.getQnaElements().clear();
        }
    }

    private void clearSummaryElements(Session session) {
        if (session.getSummaryElements() != null) {
            session.getSummaryElements().clear();
        }
    }
}

