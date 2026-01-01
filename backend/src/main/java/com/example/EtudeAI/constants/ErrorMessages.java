package com.example.EtudeAI.constants;

public final class ErrorMessages {

    // User related errors
    public static final String USER_NOT_FOUND = "User not found";
    public static final String USER_ALREADY_EXISTS = "User already exists";
    public static final String INVALID_USER_DATA = "Invalid user data";

    // Session related errors
    public static final String SESSION_NOT_FOUND = "Session not found";
    public static final String SESSION_UNAUTHORIZED = "Unauthorized access to session";

    // Authentication/Authorization errors
    public static final String UNAUTHORIZED = "Unauthorized access";
    public static final String FORBIDDEN = "Access denied";
    public static final String INVALID_TOKEN = "Invalid or expired token";

    // Keycloak errors
    public static final String KEYCLOAK_USER_CREATION_FAILED = "Failed to create user in Keycloak";
    public static final String KEYCLOAK_UPDATE_FAILED = "Failed to update user in Keycloak";
    public static final String KEYCLOAK_CONNECTION_ERROR = "Unable to connect to Keycloak";

    // AI Service errors
    public static final String AI_SERVICE_UNAVAILABLE = "AI service is currently unavailable";
    public static final String AI_REQUEST_FAILED = "Failed to process AI request";

    // Validation errors
    public static final String VALIDATION_FAILED = "Input validation failed";
    public static final String INVALID_EMAIL = "Invalid email format";
    public static final String INVALID_PASSWORD = "Invalid password format";

    // Generic errors
    public static final String INTERNAL_SERVER_ERROR = "An unexpected error occurred";
    public static final String BAD_REQUEST = "Bad request";
    public static final String RESOURCE_NOT_FOUND = "Requested resource not found";

    private ErrorMessages() {
        // Private constructor to prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
}


