package com.example.EtudeAI.util;
import com.example.EtudeAI.exception.BadRequestException;
import lombok.experimental.UtilityClass;
import java.util.regex.Pattern;
@UtilityClass
public class ValidationUtil {
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$"
    );
    public static void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email cannot be empty");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("Invalid email format");
        }
    }
    public static void validatePasswordStrength(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new BadRequestException("Password cannot be empty");
        }
        if (password.length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters long");
        }
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(
                "Password must contain at least one digit, one lowercase letter, " +
                "one uppercase letter, and one special character"
            );
        }
    }
    public static void validateNotEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " cannot be empty");
        }
    }
    public static void validateRange(int value, int min, int max, String fieldName) {
        if (value < min || value > max) {
            throw new BadRequestException(
                String.format("%s must be between %d and %d", fieldName, min, max)
            );
        }
    }
    public static void validateQuizScore(int score, int totalQuestions) {
        if (score < 0) {
            throw new BadRequestException("Score cannot be negative");
        }
        if (totalQuestions <= 0) {
            throw new BadRequestException("Total questions must be positive");
        }
        if (score > totalQuestions) {
            throw new BadRequestException("Score cannot exceed total questions");
        }
    }
}
