package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.constants.ErrorMessages;
import com.example.EtudeAI.exception.ResourceNotFoundException;
import com.example.EtudeAI.exception.UnauthorizedException;
import com.example.EtudeAI.model.dto.QuizSubmissionDTO;
import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.Status;
import com.example.EtudeAI.repository.SessionRepository;
import com.example.EtudeAI.repository.UserRepository;
import com.example.EtudeAI.service.GamificationService;
import com.example.EtudeAI.service.SessionService;
import com.example.EtudeAI.service.session.SessionTypeHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.example.EtudeAI.model.dto.QnAElementDTO;
import com.example.EtudeAI.model.dto.QuizElementDTO;
import com.example.EtudeAI.model.dto.SummaryElementDTO;
import com.example.EtudeAI.model.entity.QnAElement;
import com.example.EtudeAI.model.entity.QuizElement;
import com.example.EtudeAI.model.entity.SummaryElement;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final List<SessionTypeHandler> sessionTypeHandlers;

    @Transactional
    @Override
    public SessionDTO saveSession(SessionDTO sessionDTO, String keycloakUserId) {
        User user = findUserByKeycloakId(keycloakUserId);

        Session session = new Session();
        if (sessionDTO.id() != null) {
            session = sessionRepository.findById(sessionDTO.id())
                    .orElse(new Session());
        }

        // Set common session fields
        session.setUser(user);
        session.setLevel(sessionDTO.level());
        session.setSubject(sessionDTO.subject());
        session.setModule(sessionDTO.module());
        session.setLesson(sessionDTO.lesson());
        session.setStatus(sessionDTO.status());
        session.setSessionType(sessionDTO.sessionType());
        session.setStartedAt(sessionDTO.startedAt());
        session.setCompletedAt(sessionDTO.completedAt());
        session.setSessionFeedback(sessionDTO.sessionFeedback());
        session.setLessonContent(sessionDTO.lessonContent());

        // Delegate to the appropriate handler based on session type (Strategy Pattern)
        SessionTypeHandler handler = findHandler(sessionDTO);
        handler.handle(session, sessionDTO, user);

        Session savedSession = sessionRepository.save(session);

        // Trigger session completion gamification if status is COMPLETED
        if (sessionDTO.status() == Status.COMPLETED) {
            gamificationService.processSessionCompletion(user);
        }

        return mapToDTO(savedSession);
    }

    @Transactional
    @Override
    public void submitQuizResult(String keycloakUserId, QuizSubmissionDTO submission) {
        User user = findUserByKeycloakId(keycloakUserId);
        gamificationService.processQuizCompletion(user, submission.getScore());
    }

    private SessionTypeHandler findHandler(SessionDTO sessionDTO) {
        return sessionTypeHandlers.stream()
                .filter(h -> h.supports(sessionDTO.sessionType()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No handler found for session type: " + sessionDTO.sessionType()));
    }

    private User findUserByKeycloakId(String keycloakUserId) {
        return userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    @Override
    public Page<SessionDTO> getUserSessions(String keycloakUserId, Pageable pageable) {
        User user = findUserByKeycloakId(keycloakUserId);

        Page<Session> sessions = sessionRepository.findByUserId(user.getId(), pageable);

        return sessions.map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    @Override
    public SessionDTO getSessionById(UUID sessionId, String keycloakUserId) {
        User user = findUserByKeycloakId(keycloakUserId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException(ErrorMessages.SESSION_UNAUTHORIZED);
        }

        return mapToDTO(session);
    }

    private SessionDTO mapToDTO(Session session) {
        return new SessionDTO(
                session.getId(),
                session.getLevel(),
                session.getSubject(),
                session.getModule(),
                session.getLesson(),
                session.getStatus(),
                session.getSessionType(),
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getSummaryPointsOfFocus(),
                session.getQuizPointsOfFocus(),
                session.getQuizScore(),
                session.getSummary(),
                session.getSessionFeedback(),
                session.getLessonContent(),
                session.getQuizElements() != null
                        ? session.getQuizElements().stream().map(this::mapQuizElementToDTO).collect(Collectors.toList())
                        : null,
                session.getQnaElements() != null
                        ? session.getQnaElements().stream().map(this::mapQnAElementToDTO).collect(Collectors.toList())
                        : null,
                session.getSummaryElements() != null
                        ? session.getSummaryElements().stream().map(this::mapSummaryElementToDTO).collect(Collectors.toList())
                        : null);
    }

    private QuizElementDTO mapQuizElementToDTO(QuizElement element) {
        return new QuizElementDTO(
                element.getId(),
                element.getQuizType(),
                element.getQuestion(),
                element.getOptions(),
                element.getAnswer(),
                element.getAnswered());
    }

    private QnAElementDTO mapQnAElementToDTO(QnAElement element) {
        return new QnAElementDTO(
                element.getId(),
                element.getQuestion(),
                element.getAnswer());
    }

    private SummaryElementDTO mapSummaryElementToDTO(SummaryElement element) {
        return new SummaryElementDTO(
                element.getId(),
                element.getContent());
    }
}
