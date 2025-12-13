package com.example.EtudeAI.Controller;

import com.example.EtudeAI.model.dto.QuizSubmissionDTO;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.repository.UserRepository;
import com.example.EtudeAI.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.EtudeAI.service.SessionService;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Session Management", description = "Endpoints for managing study sessions and quiz results")
public class SessionController {

    private final GamificationService gamificationService;
    private final UserRepository userRepository;
    private final SessionService sessionService;

    @PostMapping("/quiz/submit")
    @Operation(summary = "Submit Quiz Result", description = "Submits a quiz score to track progress and trigger achievements.")
    public ResponseEntity<Void> submitQuizResult(@AuthenticationPrincipal Jwt jwt,
            @RequestBody QuizSubmissionDTO submission) {
        String keycloakUserId = jwt.getSubject();
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        gamificationService.processQuizCompletion(user, submission.getScore());

        // Return 200 OK. The frontend can check /api/achievements/me separately or via
        // WebSocket in future
        // to see if something new was unlocked. For simplicity now, we just accept the
        // result.
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "Get User Sessions", description = "Retrieves a paginated list of study sessions for the current user.")
    public ResponseEntity<org.springframework.data.domain.Page<com.example.EtudeAI.model.dto.SessionDTO>> getUserSessions(
            @AuthenticationPrincipal Jwt jwt,
            org.springframework.data.domain.Pageable pageable) {
        String keycloakUserId = jwt.getSubject();
        org.springframework.data.domain.Page<com.example.EtudeAI.model.dto.SessionDTO> sessions = sessionService
                .getUserSessions(keycloakUserId, pageable);
        return ResponseEntity.ok(sessions);
    }
}
