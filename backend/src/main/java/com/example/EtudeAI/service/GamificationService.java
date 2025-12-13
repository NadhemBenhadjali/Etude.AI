package com.example.EtudeAI.service;

import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.CriteriaType;
import com.example.EtudeAI.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final AchievementService achievementService;

    private final UserRepository userRepository;

    @Async
    @Transactional
    public void processSessionCompletion(User user) {
        int sessionCount = user.getSessions().size();
        achievementService.checkAndUnlock(user, CriteriaType.SESSION_COUNT, sessionCount);
    }

    @Async
    @Transactional
    public void processQuizCompletion(User user, int score) {
        if (user.getId() == null)
            return;

        User freshUser = userRepository.findById(user.getId()).orElse(user);

        int newTotalQuizzes = freshUser.getTotalQuizzes() + 1;
        freshUser.setTotalQuizzes(newTotalQuizzes);

        if (score > freshUser.getHighestScore()) {
            freshUser.setHighestScore(score);
        }

        userRepository.save(freshUser);

        achievementService.checkAndUnlock(freshUser, CriteriaType.QUIZ_COUNT, newTotalQuizzes);
        achievementService.checkAndUnlock(freshUser, CriteriaType.SCORE_REACHED, freshUser.getHighestScore());
    }
}
