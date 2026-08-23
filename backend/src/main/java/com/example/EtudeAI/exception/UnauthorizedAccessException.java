package com.example.EtudeAI.exception;

public class UnauthorizedAccessException extends RuntimeException {
  public UnauthorizedAccessException(String message) {
    super(message);
  }
}
