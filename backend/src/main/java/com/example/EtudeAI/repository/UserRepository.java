package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByKeycloakUserId(String keycloakUserId);
    void deleteByKeycloakUserId(String keycloakUserId);
    boolean existsByKeycloakUserId(String keycloakUserId);
}
