package com.example.EtudeAI.Controller;

import com.example.EtudeAI.model.dto.QuizSubmissionDTO;
import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Session Management", description = "Endpoints for managing study sessions and quiz results")
public class SessionController {

    private final SessionService sessionService;

    @PostMapping("/quiz/submit")
    @Operation(summary = "Submit Quiz Result", description = "Submits a quiz score to track progress and trigger achievements.")
    public ResponseEntity<Void> submitQuizResult(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody QuizSubmissionDTO submission) {
        String keycloakUserId = jwt.getSubject();
        sessionService.submitQuizResult(keycloakUserId, submission);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/save")
    @Operation(summary = "Save Session", description = "Saves the current session state, including generated content.")
    public ResponseEntity<SessionDTO> saveSession(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody com.example.EtudeAI.model.dto.SessionDTO sessionDTO) {
        String keycloakUserId = jwt.getSubject();
        SessionDTO savedSession = sessionService.saveSession(sessionDTO, keycloakUserId);
        return ResponseEntity.ok(savedSession);
    }

    @GetMapping
    @Operation(summary = "Get User Sessions", description = "Retrieves a paginated list of study sessions for the current user.")
    public ResponseEntity<org.springframework.data.domain.Page<SessionDTO>> getUserSessions(
            @AuthenticationPrincipal Jwt jwt,
            org.springframework.data.domain.Pageable pageable) {
        String keycloakUserId = jwt.getSubject();
        org.springframework.data.domain.Page<SessionDTO> sessions = sessionService
                .getUserSessions(keycloakUserId, pageable);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Session Details", description = "Retrieves full details of a specific session.")
    public ResponseEntity<SessionDTO> getSession(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        String keycloakUserId = jwt.getSubject();
        SessionDTO session = sessionService.getSessionById(id, keycloakUserId);
        return ResponseEntity.ok(session);
    }
}
