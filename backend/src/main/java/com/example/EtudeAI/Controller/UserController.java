package com.example.EtudeAI.controller;

import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping()
    public ResponseEntity<UUID> createUser(@AuthenticationPrincipal Jwt jwt, @RequestBody UserDTO userDTO) {
        String keycloakUserId = jwt.getSubject();
        UUID userId = userService.createUser(keycloakUserId, userDTO);
        return ResponseEntity.ok(userId);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getUser(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        UserDTO userDTO = userService.getUser(keycloakUserId);
        return ResponseEntity.ok(userDTO);
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateUser(@AuthenticationPrincipal Jwt jwt, @RequestBody UserDTO userDTO) {
        String keycloakUserId = jwt.getSubject();
        UserDTO updatedUserDTO = userService.updateUser(keycloakUserId, userDTO);
        return ResponseEntity.ok(updatedUserDTO);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        userService.deleteUser(keycloakUserId);
        return ResponseEntity.noContent().build();
    }
}
