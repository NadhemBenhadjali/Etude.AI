package com.example.EtudeAI.service;

import com.example.EtudeAI.model.entity.User;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Transactional;

public interface GamificationService {

    void processSessionCompletion(User user);


    void processQuizCompletion(User user, int score);


    void processQnaCompletion(User user);


    void processSummaryCompletion(User user);
}
