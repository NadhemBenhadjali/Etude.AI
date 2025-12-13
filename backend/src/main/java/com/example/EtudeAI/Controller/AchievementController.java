package com.example.EtudeAI.Controller;

import com.example.EtudeAI.model.dto.AchievementDTO;
import com.example.EtudeAI.service.AchievementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
@Tag(name = "Gamification", description = "Endpoints for user achievements and badges")
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/me")
    @Operation(summary = "Get My Achievements", description = "Returns a list of all achievements with unlocked status for the current user.")
    public ResponseEntity<List<AchievementDTO>> getMyAchievements(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        return ResponseEntity.ok(achievementService.getUserAchievements(keycloakUserId));
    }
}
