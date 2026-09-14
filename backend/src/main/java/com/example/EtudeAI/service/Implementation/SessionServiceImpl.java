package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.constants.ErrorMessages;
import com.example.EtudeAI.exception.*;
import com.example.EtudeAI.model.dto.QuizSubmissionDTO;
import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.Status;
import com.example.EtudeAI.model.mapper.SessionMapper;
import com.example.EtudeAI.repository.SessionRepository;
import com.example.EtudeAI.repository.UserRepository;
import com.example.EtudeAI.service.GamificationService;
import com.example.EtudeAI.service.SessionService;
import com.example.EtudeAI.service.helper.SessionTypeHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import com.example.EtudeAI.model.dto.SessionUpdateDTO;


@Service
@RequiredArgsConstructor
@Transactional
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final List<SessionTypeHandler> sessionTypeHandlers;
    private final SessionMapper sessionMapper;

    @Transactional
    @Override
    public SessionDTO saveSession(SessionDTO sessionDTO, String keycloakUserId) {
        User user = findUserByKeycloakId(keycloakUserId);
        Session session;
        boolean isNewCompletion = false;
        if (sessionDTO.id() != null && sessionRepository.existsById(sessionDTO.id())) {
            session = sessionRepository.findById(sessionDTO.id()).get();
            if (!session.getUser().getId().equals(user.getId())) {
                throw new UnauthorizedAccessException("User is not authorized to modify this session");
            }
            if (session.getStatus() != Status.COMPLETED && sessionDTO.status() == Status.COMPLETED) {
                isNewCompletion = true;
            }
            sessionMapper.updateSessionFromDto(sessionDTO, session);
        } else {
            session = sessionMapper.toEntity(sessionDTO);
            session.setId(null);
            session.setUser(user);

            if (sessionDTO.status() == Status.COMPLETED) {
                isNewCompletion = true;
            }
        }
        SessionTypeHandler handler = findHandler(sessionDTO);
        handler.handle(session, sessionDTO, user);
        Session savedSession = sessionRepository.save(session);

        if (isNewCompletion) {
            gamificationService.processSessionCompletion(user);
        }

        return sessionMapper.toDTO(savedSession);
    }

    @Transactional
    @Override
    public void submitQuizResult(String keycloakUserId, QuizSubmissionDTO submission) {
        User user = findUserByKeycloakId(keycloakUserId);
        gamificationService.processQuizCompletion(user, submission.getScore());
    }

    @Transactional
    @Override
    public SessionDTO updateSession(UUID sessionId, SessionUpdateDTO updateDTO, String keycloakUserId) {
        User user = findUserByKeycloakId(keycloakUserId);
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(ErrorMessages.SESSION_NOT_FOUND));
        if (!session.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException(ErrorMessages.SESSION_UNAUTHORIZED);
        }
        boolean isNewCompletion = session.getStatus() != Status.COMPLETED && updateDTO.getStatus() == Status.COMPLETED;

        sessionMapper.updateSessionFromUpdateDto(updateDTO, session);

        if (updateDTO.getSessionType() != null || hasTypeSpecificElements(updateDTO)) {
            SessionDTO sessionDTO = sessionMapper.toDTO(session);
            SessionTypeHandler handler = findHandler(sessionDTO);
            handler.handle(session, sessionDTO, user);
        }

        Session savedSession = sessionRepository.save(session);

        if (isNewCompletion) {
            gamificationService.processSessionCompletion(user);
        }

        return sessionMapper.toDTO(savedSession);
    }


    @Transactional(readOnly = true)
    @Override
    public Page<SessionDTO> getUserSessions(String keycloakUserId, Pageable pageable) {
        User user = findUserByKeycloakId(keycloakUserId);
        return sessionRepository.findByUserId(user.getId(), pageable).map(sessionMapper::toDTO);
    }

    @Transactional(readOnly = true)
    @Override
    public SessionDTO getSessionById(UUID sessionId, String keycloakUserId) {
        User user = findUserByKeycloakId(keycloakUserId);
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(ErrorMessages.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException(ErrorMessages.SESSION_UNAUTHORIZED);
        }
        return sessionMapper.toDTO(session);
    }

    private boolean hasTypeSpecificElements(SessionUpdateDTO updateDTO) {
        return (updateDTO.getQuizElements() != null && !updateDTO.getQuizElements().isEmpty())
                || (updateDTO.getQnaElements() != null && !updateDTO.getQnaElements().isEmpty())
                || (updateDTO.getSummaryElements() != null && !updateDTO.getSummaryElements().isEmpty());
    }

    private SessionTypeHandler findHandler(SessionDTO sessionDTO) {
        return sessionTypeHandlers.stream().filter(h -> h.supports(sessionDTO.sessionType())).findFirst().orElseThrow(() -> new IllegalStateException("No handler found for session type: " + sessionDTO.sessionType()));
    }

    private User findUserByKeycloakId(String keycloakUserId) {
        return userRepository.findByKeycloakUserId(keycloakUserId).orElseThrow(() -> new UserNotFound(ErrorMessages.USER_NOT_FOUND));
    }
}
