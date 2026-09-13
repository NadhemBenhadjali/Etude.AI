package com.example.EtudeAI.service;

import com.example.EtudeAI.model.entity.User;
import lombok.NonNull;

public interface GamificationService {

    void processSessionCompletion(User user);


    void processQuizCompletion(@NonNull User user, int score);


    void processQnaCompletion(@NonNull User user);


    void processSummaryCompletion(@NonNull User user);
}
