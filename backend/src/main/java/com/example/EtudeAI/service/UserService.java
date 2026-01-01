package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.UserDTO;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface UserService {

    UUID createUser(String keycloakUserId, UserDTO dto);


    UserDTO getUser(String keycloakUserId);


    UserDTO updateUser(String keycloakUserId, UserDTO dto);

    void changePassword(String keycloakUserId, String newPassword);


    void deleteUser(String keycloakUserId);


    void updateElo(String keycloakUserId, int newElo);
}
