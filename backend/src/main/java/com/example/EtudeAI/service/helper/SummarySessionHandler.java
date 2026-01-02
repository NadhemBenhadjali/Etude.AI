package com.example.EtudeAI.service.helper;

import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.dto.SummaryElementDTO;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.SummaryElement;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.SessionType;
import com.example.EtudeAI.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Handler for SUMMARY session type.
 * Processes summary-specific fields and summary elements.
 */
@Component
@RequiredArgsConstructor
public class SummarySessionHandler implements SessionTypeHandler {

    private final GamificationService gamificationService;

    @Override
    public boolean supports(SessionType sessionType) {
        return sessionType == SessionType.SUMMARY;
    }

    @Override
    public void handle(Session session, SessionDTO sessionDTO, User user) {
        // Set summary-specific fields
        session.setSummaryPointsOfFocus(sessionDTO.summaryPointsOfFocus());
        session.setSummary(sessionDTO.summary());

        // Clear other type-specific data
        session.setQuizPointsOfFocus(null);
        session.setQuizScore(null);
        clearQuizElements(session);
        clearQnaElements(session);

        // Handle Summary Elements
        handleSummaryElements(session, sessionDTO, user);
    }

    private void handleSummaryElements(Session session, SessionDTO sessionDTO, User user) {
        if (sessionDTO.summaryElements() != null) {
            if (session.getSummaryElements() != null) {
                session.getSummaryElements().clear();
            }
            for (SummaryElementDTO summaryDTO : sessionDTO.summaryElements()) {
                SummaryElement summary = SummaryElement.builder()
                        .content(summaryDTO.content())
                        .build();
                session.addSummaryElement(summary);
            }
            // Trigger gamification for Summary completion
            if (!sessionDTO.summaryElements().isEmpty()) {
                gamificationService.processSummaryCompletion(user);
            }
        }
    }

    private void clearQuizElements(Session session) {
        if (session.getQuizElements() != null) {
            session.getQuizElements().clear();
        }
    }

    private void clearQnaElements(Session session) {
        if (session.getQnaElements() != null) {
            session.getQnaElements().clear();
        }
    }
}

