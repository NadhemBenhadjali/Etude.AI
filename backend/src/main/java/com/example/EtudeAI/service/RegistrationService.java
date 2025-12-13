package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.UserDTO;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final Keycloak keycloak;
    private final UserService userService;

    @Value("${keycloak.realm:etudeai}")
    private String realm;

    public void registerUser(UserDTO userDTO, String password) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(userDTO.getEmail());
        user.setEmail(userDTO.getEmail());
        user.setFirstName(userDTO.getFirstname());
        user.setLastName(userDTO.getLastname());
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);

        user.setCredentials(Collections.singletonList(credential));

        UsersResource usersResource = keycloak.realm(realm).users();
        Response response = usersResource.create(user);

        if (response.getStatus() == 201) {
            String userId = CreatedResponseUtil.getCreatedId(response);

            // Create user in local DB
            userService.createUser(userId, userDTO);
        } else {
            throw new RuntimeException("Failed to create user in Keycloak: " + response.getStatusInfo());
        }
    }
}
