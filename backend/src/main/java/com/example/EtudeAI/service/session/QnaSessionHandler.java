package com.example.EtudeAI.service.session;

import com.example.EtudeAI.model.dto.QnAElementDTO;
import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.QnAElement;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.SessionType;
import com.example.EtudeAI.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Handler for QNA session type.
 * Processes Q&A-specific fields and QnA elements.
 */
@Component
@RequiredArgsConstructor
public class QnaSessionHandler implements SessionTypeHandler {

    private final GamificationService gamificationService;

    @Override
    public boolean supports(SessionType sessionType) {
        return sessionType == SessionType.QNA;
    }

    @Override
    public void handle(Session session, SessionDTO sessionDTO, User user) {
        // Clear other type-specific data
        session.setQuizPointsOfFocus(null);
        session.setQuizScore(null);
        session.setSummaryPointsOfFocus(null);
        session.setSummary(null);
        clearQuizElements(session);
        clearSummaryElements(session);

        // Handle QnA Elements
        handleQnaElements(session, sessionDTO, user);
    }

    private void handleQnaElements(Session session, SessionDTO sessionDTO, User user) {
        if (sessionDTO.qnaElements() != null) {
            if (session.getQnaElements() != null) {
                session.getQnaElements().clear();
            }
            for (QnAElementDTO qnaDTO : sessionDTO.qnaElements()) {
                QnAElement qna = new QnAElement();
                qna.setQuestion(qnaDTO.question());
                qna.setAnswer(qnaDTO.answer());
                session.addQnAElement(qna);
            }
            // Trigger gamification for QnA completion
            if (!sessionDTO.qnaElements().isEmpty()) {
                gamificationService.processQnaCompletion(user);
            }
        }
    }

    private void clearQuizElements(Session session) {
        if (session.getQuizElements() != null) {
            session.getQuizElements().clear();
        }
    }

    private void clearSummaryElements(Session session) {
        if (session.getSummaryElements() != null) {
            session.getSummaryElements().clear();
        }
    }
}

