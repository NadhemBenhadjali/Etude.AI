package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.exception.KeycloakException;
import com.example.EtudeAI.exception.UserAlreadyExists;
import com.example.EtudeAI.model.dto.UserDTO;
import com.example.EtudeAI.service.RegistrationService;
import com.example.EtudeAI.service.UserService;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final Keycloak keycloak;
    private final UserService userService;

    @Value("${keycloak.realm:etudeai}")
    private String realm;

    @Override
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

        String keycloakUserId;
        
        try (Response response = usersResource.create(user)) {
            if (response.getStatus() == 201) {
                keycloakUserId = CreatedResponseUtil.getCreatedId(response);
            } else if (response.getStatus() == 409) {
                throw new UserAlreadyExists("User with email " + userDTO.getEmail() + " already exists");
            } else {
                throw new KeycloakException(
                        "Failed to create user in Keycloak: " + response.getStatusInfo(),
                        response.getStatus()
                );
            }
        }

        try {
            userService.createUser(keycloakUserId, userDTO);
        } catch (Exception e) {
            log.error("Failed to save user in local DB after Keycloak creation. Rolling back Keycloak user: {}", keycloakUserId, e);

            if (keycloakUserId != null) {
                try {
                    usersResource.get(keycloakUserId).remove();
                } catch (Exception cleanupEx) {
                    log.error("CRITICAL: Failed to delete Keycloak user {} during rollback compensation", keycloakUserId, cleanupEx);
                }
            }
            throw e; 
        }
    }
}