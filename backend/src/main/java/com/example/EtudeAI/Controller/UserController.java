package com.example.EtudeAI.Controller;

import com.example.EtudeAI.model.dto.ChangePasswordRequest;
import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user profiles")
public class UserController {

    private final UserService userService;

    @PostMapping()
    @Operation(summary = "Create User", description = "Creates a new user profile linked to Keycloak ID.")
    public ResponseEntity<UUID> createUser(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserDTO userDTO) {
        String keycloakUserId = jwt.getSubject();
        UUID userId = userService.createUser(keycloakUserId, userDTO);
        return ResponseEntity.ok(userId);
    }

    @GetMapping("/me")
    @Operation(summary = "Get Current User", description = "Retrieves the profile of the currently authenticated user.")
    public ResponseEntity<UserDTO> getUser(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        UserDTO userDTO = userService.getUser(keycloakUserId);
        return ResponseEntity.ok(userDTO);
    }

    @PutMapping("/me")
    @Operation(summary = "Update Current User", description = "Updates the profile of the currently authenticated user.")
    public ResponseEntity<UserDTO> updateUser(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserDTO userDTO) {
        String keycloakUserId = jwt.getSubject();
        UserDTO updatedUserDTO = userService.updateUser(keycloakUserId, userDTO);
        return ResponseEntity.ok(updatedUserDTO);
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete Current User", description = "Deletes the profile of the currently authenticated user.")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        userService.deleteUser(keycloakUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/change-password")
    @Operation(summary = "Change password", description = "Changes the current user password in Keycloak.")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        String keycloakUserId = jwt.getSubject();
        userService.changePassword(keycloakUserId, request.newPassword());

        return ResponseEntity.noContent().build();
    }
}
