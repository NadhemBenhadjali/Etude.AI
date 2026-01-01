package com.example.EtudeAI.Controller;

import com.example.EtudeAI.model.dto.RegistrationDTO;
import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Public Access", description = "Public endpoints for registration and other non-authenticated actions")
public class PublicController {

    private final RegistrationService registrationService;

    @PostMapping("/register")
    @Operation(summary = "Register User", description = "Registers a new user in Keycloak and the application database.")
    public ResponseEntity<String> register(@Valid @RequestBody RegistrationDTO registrationDTO) {
        UserDTO userDTO = new UserDTO();
        userDTO.setEmail(registrationDTO.getEmail());
        userDTO.setFirstname(registrationDTO.getFirstname());
        userDTO.setLastname(registrationDTO.getLastname());
        userDTO.setBirthDate(registrationDTO.getBirthDate());
        userDTO.setLevel(registrationDTO.getLevel() != null ? registrationDTO.getLevel() : Level.FIRST);
        userDTO.setAvatar(registrationDTO.getAvatar());

        registrationService.registerUser(userDTO, registrationDTO.getPassword());

        return ResponseEntity.ok("User registered successfully");
    }
}
