package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.QuizSubmissionDTO;
import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.dto.SessionUpdateDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface SessionService {

    SessionDTO saveSession(SessionDTO sessionDTO, String keycloakUserId);

    Page<SessionDTO> getUserSessions(String keycloakUserId, Pageable pageable);

    SessionDTO getSessionById(UUID sessionId, String keycloakUserId);

    /**
     * Update an existing session (for starting/completing planned sessions).
     * Only updates non-null fields from the DTO.
     * @param sessionId the session ID to update
     * @param updateDTO the partial session data to update
     * @param keycloakUserId the user's Keycloak ID
     * @return the updated session DTO
     */
    SessionDTO updateSession(UUID sessionId, SessionUpdateDTO updateDTO, String keycloakUserId);

    /**
     * Submit quiz result for gamification processing.
     * @param keycloakUserId the user's Keycloak ID
     * @param submission the quiz submission data
     */
    void submitQuizResult(String keycloakUserId, QuizSubmissionDTO submission);
}
