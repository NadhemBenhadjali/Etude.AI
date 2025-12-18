package com.example.EtudeAI.constants;

public final class ApiConstants {

    // API Version
    public static final String API_VERSION = "v1";
    public static final String API_BASE_PATH = "/api";

    // Session Headers
    public static final String SESSION_ID_HEADER = "X-Session-ID";

    // Cache Names
    public static final String USERS_CACHE = "users";
    public static final String ACHIEVEMENTS_CACHE = "achievements";

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT_FIELD = "createdAt";

    // Validation Constants
    public static final int MIN_PASSWORD_LENGTH = 8;
    public static final int MAX_PASSWORD_LENGTH = 100;
    public static final int MIN_NAME_LENGTH = 2;
    public static final int MAX_NAME_LENGTH = 50;

    // Quiz Constants
    public static final int MIN_QUIZ_SCORE = 0;
    public static final int DEFAULT_MC_QUESTIONS = 6;
    public static final int DEFAULT_TF_QUESTIONS = 4;

    private ApiConstants() {
        // Private constructor to prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
}

