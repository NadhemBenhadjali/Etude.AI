package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.exception.BadRequestException;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.CriteriaType;
import com.example.EtudeAI.repository.UserRepository;

import com.example.EtudeAI.service.AchievementService;
import com.example.EtudeAI.service.GamificationService;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationServiceImpl implements GamificationService {

    private final AchievementService achievementService;
    private final UserRepository userRepository;

    @Async
    @Transactional
    @CacheEvict(value = "users", key = "#user.keycloakUserId")
    @Override
    public void processSessionCompletion(User user) {
        int sessionCount = user.getSessions().size();
        achievementService.checkAndUnlock(user, CriteriaType.SESSION_COUNT, sessionCount);
    }

    @Async
    @Transactional
    @CacheEvict(value = "users", key = "#user.keycloakUserId")
    @Override
    public void processQuizCompletion(@NonNull User user, @PositiveOrZero int score) {
        if (user.getId() == null ) {
            log.error("Cannot process quiz completion: user id is null");
            throw new BadRequestException("User ID cannot be null");
        }

        User freshUser = userRepository.findById(user.getId()).orElse(user);

        int newTotalQuizzes = freshUser.getTotalQuizzes() + 1;
        freshUser.setTotalQuizzes(newTotalQuizzes);
        int newElo = freshUser.getElo() + score*10;
        if (score > freshUser.getHighestScore()) {
            freshUser.setHighestScore(score);
            newElo+=50;
        }
        freshUser.setElo(newElo);
        userRepository.save(freshUser);

        achievementService.checkAndUnlock(freshUser, CriteriaType.QUIZ_COUNT, newTotalQuizzes);
        achievementService.checkAndUnlock(freshUser, CriteriaType.SCORE_REACHED, freshUser.getElo());

        log.info("Quiz completion processed for user: {}, score: {}", user.getId(), score);
    }

    @Async
    @Transactional
    @CacheEvict(value = "users", key = "#user.keycloakUserId")
    @Override
    public void processQnaCompletion(@NonNull User user) {
        if (user.getId() == null) {
            log.error("Cannot process QnA completion: user id is null");
            throw new BadRequestException("User ID cannot be null");
        }

        User freshUser = userRepository.findById(user.getId()).orElse(user);
        int newTotalQna = freshUser.getTotalQna() + 1;
        freshUser.setTotalQna(newTotalQna);
        freshUser.setElo(freshUser.getElo() + 5);
        userRepository.save(freshUser);

        achievementService.checkAndUnlock(freshUser, CriteriaType.QNA_COUNT, newTotalQna);
        achievementService.checkAndUnlock(freshUser, CriteriaType.SCORE_REACHED, freshUser.getElo());
        log.info("QnA completion processed for user: {}", user.getId());
    }

    @Async
    @Transactional
    @CacheEvict(value = "users", key = "#user.keycloakUserId")
    @Override
    public void processSummaryCompletion(@NonNull User user) {
        if (user.getId() == null) {
            log.error("Cannot process summary completion: user id is null");
            throw new BadRequestException("User ID cannot be null");
        }

        User freshUser = userRepository.findById(user.getId()).orElse(user);
        int newTotalSummaries = freshUser.getTotalSummaries() + 1;
        freshUser.setTotalSummaries(newTotalSummaries);
        freshUser.setElo(freshUser.getElo() + 5);
        userRepository.save(freshUser);

        achievementService.checkAndUnlock(freshUser, CriteriaType.SUMMARY_COUNT, newTotalSummaries);
        achievementService.checkAndUnlock(freshUser, CriteriaType.SCORE_REACHED, freshUser.getElo());
        log.info("Summary completion processed for user: {}", user.getId());
    }
}
