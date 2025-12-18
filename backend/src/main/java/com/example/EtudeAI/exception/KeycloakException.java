package com.example.EtudeAI.exception;

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

    public int getStatusCode() {
        return statusCode;
    }
}

