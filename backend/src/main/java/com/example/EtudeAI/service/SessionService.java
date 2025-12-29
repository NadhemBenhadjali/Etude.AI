package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.entity.Session;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.Status;
import com.example.EtudeAI.repository.SessionRepository;
import com.example.EtudeAI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    @Transactional
    public SessionDTO saveSession(SessionDTO sessionDTO, String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

        // Handle session type-specific logic
        switch (sessionDTO.sessionType()) {
            case QUIZ -> handleQuizSession(session, sessionDTO, user);
            case QNA -> handleQnASession(session, sessionDTO, user);
            case SUMMARY -> handleSummarySession(session, sessionDTO, user);
        }

        Session savedSession = sessionRepository.save(session);

        // Trigger session completion gamification if status is COMPLETED
        if (sessionDTO.status() == Status.COMPLETED) {
            gamificationService.processSessionCompletion(user);
        }

        return mapToDTO(savedSession);
    }

    private void handleQuizSession(Session session, SessionDTO sessionDTO, User user) {
        session.setQuizPointsOfFocus(sessionDTO.quizPointsOfFocus());
        session.setQuizScore(sessionDTO.quizScore());

        // Clear other type-specific data
        session.setSummaryPointsOfFocus(null);
        session.setSummary(null);
        if (session.getQnaElements() != null) {
            session.getQnaElements().clear();
        }
        if (session.getSummaryElements() != null) {
            session.getSummaryElements().clear();
        }

        // Handle Quiz Elements
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

    private void handleQnASession(Session session, SessionDTO sessionDTO, User user) {
        // Clear other type-specific data
        session.setQuizPointsOfFocus(null);
        session.setQuizScore(null);
        session.setSummaryPointsOfFocus(null);
        session.setSummary(null);
        if (session.getQuizElements() != null) {
            session.getQuizElements().clear();
        }
        if (session.getSummaryElements() != null) {
            session.getSummaryElements().clear();
        }

        // Handle QnA Elements
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

    private void handleSummarySession(Session session, SessionDTO sessionDTO, User user) {
        session.setSummaryPointsOfFocus(sessionDTO.summaryPointsOfFocus());
        session.setSummary(sessionDTO.summary());

        // Clear other type-specific data
        session.setQuizPointsOfFocus(null);
        session.setQuizScore(null);
        if (session.getQuizElements() != null) {
            session.getQuizElements().clear();
        }
        if (session.getQnaElements() != null) {
            session.getQnaElements().clear();
        }

        // Handle Summary Elements
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

    @Transactional(readOnly = true)
    public Page<SessionDTO> getUserSessions(String keycloakUserId, Pageable pageable) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<Session> sessions = sessionRepository.findByUserId(user.getId(), pageable);

        return sessions.map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public SessionDTO getSessionById(UUID sessionId, String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to session");
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
