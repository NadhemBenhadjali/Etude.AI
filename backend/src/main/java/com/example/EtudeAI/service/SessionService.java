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
import java.util.stream.Collectors;

import com.example.EtudeAI.model.dto.QnAElementDTO;
import com.example.EtudeAI.model.dto.QuizElementDTO;
import com.example.EtudeAI.model.entity.QnAElement;
import com.example.EtudeAI.model.entity.QuizElement;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public SessionDTO saveSession(SessionDTO sessionDTO, String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Session session = new Session();
        if (sessionDTO.id() != null) {
            session = sessionRepository.findById(sessionDTO.id())
                    .orElse(new Session());
        }

        session.setUser(user);
        session.setLevel(sessionDTO.level());
        session.setSubject(sessionDTO.subject());
        session.setModule(sessionDTO.module());
        session.setLesson(sessionDTO.lesson());
        session.setStatus(sessionDTO.status());
        session.setStartedAt(sessionDTO.startedAt());
        session.setCompletedAt(sessionDTO.completedAt());
        session.setSummaryPointsOfFocus(sessionDTO.summaryPointsOfFocus());
        session.setQuizPointsOfFocus(sessionDTO.quizPointsOfFocus());
        session.setQuizScore(sessionDTO.quizScore());
        session.setSummary(sessionDTO.summary());
        session.setSessionFeedback(sessionDTO.sessionFeedback());
        session.setLessonContent(sessionDTO.lessonContent());

        // Handle Quiz Elements
        if (sessionDTO.quizElements() != null) {
            // Clear existing if necessary or just add new ones?
            // For simplicity in this "save/update" logic, we might need to handle merging.
            // But if it's a new session or a full overwrite:
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
        }

        Session savedSession = sessionRepository.save(session);
        return mapToDTO(savedSession);
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
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getSummaryPointsOfFocus(),
                session.getQuizPointsOfFocus(),
                session.getQuizScore(),
                null, // summary
                session.getSessionFeedback(), // sessionFeedback
                session.getLessonContent(), // lessonContent
                session.getQuizElements() != null
                        ? session.getQuizElements().stream().map(this::mapQuizElementToDTO).collect(Collectors.toList())
                        : null,
                session.getQnaElements() != null
                        ? session.getQnaElements().stream().map(this::mapQnAElementToDTO).collect(Collectors.toList())
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
}
