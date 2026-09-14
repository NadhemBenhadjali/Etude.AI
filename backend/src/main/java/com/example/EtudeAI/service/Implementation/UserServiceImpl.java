package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.exception.KeycloakException;
import com.example.EtudeAI.exception.ResourceNotFoundException;
import com.example.EtudeAI.exception.UserAlreadyExists;
import com.example.EtudeAI.exception.UserNotFound;
import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.mapper.UserMapper;
import com.example.EtudeAI.repository.UserRepository;
import com.example.EtudeAI.service.UserService;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final Keycloak keycloak;
    private final UserMapper userMapper;

    @Value("${keycloak.realm:etudeai}")
    private String realm;

    @Transactional
    @CacheEvict(value = "users", key = "#keycloakUserId", beforeInvocation = true)
    @Override
    public UUID createUser(String keycloakUserId, UserDTO dto) {
        if (userRepository.findByKeycloakUserId(keycloakUserId).isPresent()) {
            throw new UserAlreadyExists("User with this email already exists");
        }
        User user = User.builder()
                .keycloakUserId(keycloakUserId)
                .email(dto.getEmail())
                .firstname(dto.getFirstname())
                .lastname(dto.getLastname())
                .birthDate(dto.getBirthDate())
                .level(dto.getLevel())
                .avatar(dto.getAvatar())
                .build();

        return userRepository.save(user).getId();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "#keycloakUserId")
    @Override
    public UserDTO getUser(String keycloakUserId) {
        return  userRepository.findByKeycloakUserId(keycloakUserId).map(userMapper::toDto)
                .orElseThrow(() -> new UserNotFound("User with this Keycloak ID not found"));
    }

    @Transactional
    @CachePut(value = "users", key = "#keycloakUserId")
    @Override
    public UserDTO updateUser(String keycloakUserId, UserDTO dto) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new UserNotFound("User not found"));

        userMapper.updateUserFromDto(dto, user);
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            updateKeycloakEmail(keycloakUserId, dto.getEmail());
        }

        User updated = userRepository.save(user);

        return userMapper.toDto(updated);
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
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new UserNotFound("User with Keycloak ID = "+keycloakUserId+" not found"));

        userRepository.delete(user);

        UsersResource usersResource = keycloak.realm(realm).users();
        try {
            usersResource.get(keycloakUserId).remove();
        } catch (Exception e) {
            throw new KeycloakException("Failed to delete user from Keycloak: " + e.getMessage(), e,400);
        }
    }

    @Transactional
    @CacheEvict(value = "users", key = "#keycloakUserId")
    @Override
    public void updateElo(String keycloakUserId, int newElo) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new UserNotFound("User with Keycloak ID = "+keycloakUserId+" not found"));

        user.setElo(Math.max(newElo, 0));
        userRepository.save(user);
    }
}
