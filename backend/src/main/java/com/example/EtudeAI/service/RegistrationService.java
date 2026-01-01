package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.UserDTO;

public interface RegistrationService {
    void registerUser(UserDTO userDTO, String password);
}
