package com.example.EtudeAI.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@Getter
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class KeycloakException extends RuntimeException {

    private final int statusCode;

    public KeycloakException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public KeycloakException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public KeycloakException(String message, Exception e, int statusCode) {
        this.statusCode = statusCode;
    }

}

