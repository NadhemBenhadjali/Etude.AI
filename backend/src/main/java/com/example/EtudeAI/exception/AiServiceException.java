package com.example.EtudeAI.exception;

public class AiServiceException extends RuntimeException {

    private final String serviceName;

    public AiServiceException(String serviceName, String message) {
        super(String.format("AI Service [%s] error: %s", serviceName, message));
        this.serviceName = serviceName;
    }

    public AiServiceException(String serviceName, String message, Throwable cause) {
        super(String.format("AI Service [%s] error: %s", serviceName, message), cause);
        this.serviceName = serviceName;
    }

    public String getServiceName() {
        return serviceName;
    }
}

