package com.example.EtudeAI.exception;

public class UserAlreadyExists extends RuntimeException {
  public UserAlreadyExists(String message) {
    super(message);
  }
}
