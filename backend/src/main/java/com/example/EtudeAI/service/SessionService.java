package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.repository.SessionRepository;
import com.example.EtudeAI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<SessionDTO> getUserSessions(String keycloakUserId, Pageable pageable) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<Session> sessions = sessionRepository.findByUserId(user.getId(), pageable);

        return sessions.map(this::mapToDTO);
    }

    private SessionDTO mapToDTO(Session session) {
        return new SessionDTO(
                session.getId(),
                session.getLevel(),
                session.getSubject(),
                session.getModule(),
                session.getLesson(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getSummaryPointsOfFocus(),
                session.getQuizPointsOfFocus(),
                session.getQuizScore(),
                null, // summary
                null, // sessionFeedback
                null // lessonContent
        );
    }
}
