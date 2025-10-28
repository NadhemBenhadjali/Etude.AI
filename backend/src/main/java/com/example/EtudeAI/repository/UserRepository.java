// src/main/java/com/example/EtudeAI/repository/UserRepository.java
package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByKeycloakUserId(String keycloakUserId); // uncomment once column exists
}
