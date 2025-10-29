package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.Role;
import com.example.EtudeAI.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UUID createUser(String keycloakUserId, UserDTO dto) {
        if (userRepository.findByKeycloakUserId(keycloakUserId).isPresent()) {
            throw new IllegalStateException("User profile already exists");
        }

        User user = User.builder()
                .keycloakUserId(keycloakUserId)
                .email(dto.email())
                .firstname(dto.firstname())
                .lastname(dto.lastname())
                .birthDate(dto.birthDate())
                .level(dto.level())
                .elo(0)
                .role(Role.ROLE_USER)
                .sessions(List.of())
                .notes(List.of())
                .build();

        return userRepository.save(user).getId();
    }

    @Transactional(readOnly = true)
    public UserDTO getUser(String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return new UserDTO(
                user.getId(),
                user.getKeycloakUserId(),
                user.getEmail(),
                user.getFirstname(),
                user.getLastname(),
                user.getBirthDate(),
                user.getLevel(),
                user.getElo(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public UserDTO updateUser(String keycloakUserId, UserDTO dto) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (dto.firstname() != null) user.setFirstname(dto.firstname());
        if (dto.lastname() != null) user.setLastname(dto.lastname());
        if (dto.birthDate() != null) user.setBirthDate(dto.birthDate());
        if (dto.level() != null) user.setLevel(dto.level());

        User updated = userRepository.save(user);

        return new UserDTO(
                updated.getId(),
                updated.getKeycloakUserId(),
                updated.getEmail(),
                updated.getFirstname(),
                updated.getLastname(),
                updated.getBirthDate(),
                updated.getLevel(),
                updated.getElo(),
                updated.getRole(),
                updated.getCreatedAt(),
                updated.getUpdatedAt()
        );
    }

    public void deleteUser(String keycloakUserId) {
        if (!userRepository.existsByKeycloakUserId(keycloakUserId)) {
            throw new EntityNotFoundException("User not found");
        }
        userRepository.deleteByKeycloakUserId(keycloakUserId);
    }

    public void updateElo(String keycloakUserId, int newElo) {
        // TODO: implement Elo update logic
    }
}
