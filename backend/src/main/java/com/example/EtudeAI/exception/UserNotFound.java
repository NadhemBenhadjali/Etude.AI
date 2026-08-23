package com.project.siab2b.commun.exception;


import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.UUID;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFound extends RuntimeException {

    public UserNotFound() {
        super("User not found");
    }

    public UserNotFound(String message) {
        super(message);
    }

    public UserNotFound(UUID id){
        super("User with ID " + id + " not found");
    }


}
