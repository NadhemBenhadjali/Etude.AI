package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.exception.ResourceNotFoundException;
import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.Role;
import com.example.EtudeAI.repository.UserRepository;
import com.example.EtudeAI.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final Keycloak keycloak;

    @Value("${keycloak.realm:etudeai}")
    private String realm;

    @Transactional
    @CacheEvict(value = "users", key = "#keycloakUserId", beforeInvocation = true)
    @Override
    public UUID createUser(String keycloakUserId, UserDTO dto) {
        if (userRepository.findByKeycloakUserId(keycloakUserId).isPresent()) {
            throw new IllegalStateException("User profile already exists");
        }

        User user = User.builder()
                .keycloakUserId(keycloakUserId)
                .email(dto.getEmail())
                .firstname(dto.getFirstname())
                .lastname(dto.getLastname())
                .birthDate(dto.getBirthDate())
                .level(dto.getLevel())
                .avatar(dto.getAvatar())
                .elo(0)
                .role(Role.ROLE_USER)
                .sessions(List.of())
                .notes(List.of())
                .build();

        return userRepository.save(user).getId();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "#keycloakUserId")
    @Override
    public UserDTO getUser(String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return UserDTO.builder()
                .id(user.getId())
                .keycloakUserId(user.getKeycloakUserId())
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .birthDate(user.getBirthDate())
                .level(user.getLevel())
                .elo(user.getElo())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalQuizzes(user.getTotalQuizzes())
                .highestScore(user.getHighestScore())
                .totalQna(user.getTotalQna())
                .totalSummaries(user.getTotalSummaries())
                .build();

    }

    @Transactional
    @CachePut(value = "users", key = "#keycloakUserId")
    @Override
    public UserDTO updateUser(String keycloakUserId, UserDTO dto) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // 1) EMAIL: update in Keycloak THEN DB, if changed
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            updateKeycloakEmail(keycloakUserId, dto.getEmail());
            user.setEmail(dto.getEmail());
        }

        // 2) Other profile fields (existing logic)
        if (dto.getFirstname() != null)
            user.setFirstname(dto.getFirstname());
        if (dto.getLastname() != null)
            user.setLastname(dto.getLastname());
        if (dto.getBirthDate() != null)
            user.setBirthDate(dto.getBirthDate());
        if (dto.getLevel() != null)
            user.setLevel(dto.getLevel());

        User updated = userRepository.save(user);

        return UserDTO.builder()
                .id(updated.getId())
                .keycloakUserId(updated.getKeycloakUserId())
                .email(updated.getEmail())
                .firstname(updated.getFirstname())
                .lastname(updated.getLastname())
                .birthDate(updated.getBirthDate())
                .level(updated.getLevel())
                .elo(updated.getElo())
                .role(updated.getRole())
                .avatar(updated.getAvatar())
                .createdAt(updated.getCreatedAt())
                .updatedAt(updated.getUpdatedAt())
                .totalQuizzes(updated.getTotalQuizzes())
                .highestScore(updated.getHighestScore())
                .totalQna(updated.getTotalQna())
                .totalSummaries(updated.getTotalSummaries())
                .build();
    }

    private void updateKeycloakEmail(String keycloakUserId, String newEmail) {
        UsersResource usersResource = keycloak.realm(realm).users();

        UserRepresentation kcUser = usersResource.get(keycloakUserId).toRepresentation();
        kcUser.setEmail(newEmail);
        usersResource.get(keycloakUserId).update(kcUser);
    }

    @Transactional
    @Override
    public void changePassword(String keycloakUserId, String newPassword) {
        UsersResource usersResource = keycloak.realm(realm).users();

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setTemporary(false);
        credential.setValue(newPassword);

        usersResource.get(keycloakUserId).resetPassword(credential);
    }



    @Transactional
    @CacheEvict(value = {"users", "achievements"}, key = "#keycloakUserId")
    @Override
    public void deleteUser(String keycloakUserId) {
        if (!userRepository.existsByKeycloakUserId(keycloakUserId)) {
            throw new ResourceNotFoundException("User", "keycloakUserId", keycloakUserId);
        }
        userRepository.deleteByKeycloakUserId(keycloakUserId);
    }

    @Transactional
    @CacheEvict(value = "users", key = "#keycloakUserId")
    @Override
    public void updateElo(String keycloakUserId, int newElo) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "keycloakUserId", keycloakUserId));

        user.setElo(Math.max(newElo, 0));
        userRepository.save(user);
    }
}
