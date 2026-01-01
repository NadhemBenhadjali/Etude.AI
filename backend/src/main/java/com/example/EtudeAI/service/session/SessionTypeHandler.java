package com.example.EtudeAI.service.session;

import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.SessionType;

/**
 * Strategy interface for handling different session types.
 * Each implementation handles the specific logic for one session type (QUIZ, QNA, SUMMARY).
 * This follows the Open/Closed Principle - add new session types by creating new handlers.
 */
public interface SessionTypeHandler {

    /**
     * Check if this handler supports the given session type.
     * @param sessionType the session type to check
     * @return true if this handler can process the session type
     */
    boolean supports(SessionType sessionType);

    /**
     * Handle the session type-specific logic.
     * This includes setting type-specific fields, clearing irrelevant data,
     * and processing child elements.
     *
     * @param session the session entity to modify
     * @param sessionDTO the DTO containing the session data
     * @param user the user who owns the session
     */
    void handle(Session session, SessionDTO sessionDTO, User user);
}

