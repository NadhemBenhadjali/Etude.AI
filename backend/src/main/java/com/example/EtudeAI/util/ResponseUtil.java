package com.example.EtudeAI.util;

import lombok.experimental.UtilityClass;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@UtilityClass
public class ResponseUtil {

    /**
     * Creates a success response with data
     */
    public static <T> ResponseEntity<T> success(T data) {
        return ResponseEntity.ok(data);
    }

    /**
     * Creates a success response with custom status
     */
    public static <T> ResponseEntity<T> success(T data, HttpStatus status) {
        return ResponseEntity.status(status).body(data);
    }

    /**
     * Creates a created response (201)
     */
    public static <T> ResponseEntity<T> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(data);
    }

    /**
     * Creates a no content response (204)
     */
    public static ResponseEntity<Void> noContent() {
        return ResponseEntity.noContent().build();
    }

    /**
     * Creates a simple message response
     */
    public static ResponseEntity<Map<String, String>> message(String message) {
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * Creates a simple message response with custom status
     */
    public static ResponseEntity<Map<String, String>> message(String message, HttpStatus status) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}

