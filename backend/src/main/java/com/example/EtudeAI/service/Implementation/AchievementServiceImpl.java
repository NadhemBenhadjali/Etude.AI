package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.constants.ErrorMessages;
import com.example.EtudeAI.exception.ResourceNotFoundException;
import com.example.EtudeAI.model.dto.AchievementDTO;
import com.example.EtudeAI.model.entity.Achievement;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.entity.UserAchievement;
import com.example.EtudeAI.model.enums.CriteriaType;
import com.example.EtudeAI.repository.AchievementRepository;
import com.example.EtudeAI.repository.UserAchievementRepository;
import com.example.EtudeAI.repository.UserRepository;
import com.example.EtudeAI.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AchievementServiceImpl implements AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "achievements", key = "#keycloakUserId")
    @Override
    public List<AchievementDTO> getUserAchievements(String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.USER_NOT_FOUND));

        List<Achievement> allAchievements = achievementRepository.findAll();
        List<UserAchievement> unlocked = userAchievementRepository.findByUserId(user.getId());

        Map<UUID, UserAchievement> unlockedMap = unlocked.stream()
                .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua));

        return allAchievements.stream().map(a -> {
            UserAchievement ua = unlockedMap.get(a.getId());
            boolean isUnlocked = ua != null;
            
            // Calculate progress based on achievement criteria
            int currentValue = getCurrentValueForCriteria(user, a.getCriteriaType());
            int targetValue = a.getCriteriaValue();
            int progress = isUnlocked ? 100 : Math.min(100, (int) ((currentValue * 100.0) / targetValue));
            
            return AchievementDTO.builder()
                    .id(a.getId())
                    .name(a.getName())
                    .description(a.getDescription())
                    .icon(a.getIcon())
                    .unlocked(isUnlocked)
                    .unlockedAt(ua != null ? ua.getUnlockedAt() : null)
                    .progress(progress)
                    .currentValue(currentValue)
                    .targetValue(targetValue)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"achievements", "users"}, key = "#user.keycloakUserId")
    @Override
    public void checkAndUnlock(User user, CriteriaType type, int currentValue) {
        List<Achievement> potentiallyUnlockable = achievementRepository.findAll().stream()
                .filter(a -> a.getCriteriaType() == type)
                .filter(a -> currentValue >= a.getCriteriaValue())
                .collect(Collectors.toList());

        for (Achievement a : potentiallyUnlockable) {
            if (!userAchievementRepository.existsByUserIdAndAchievementId(user.getId(), a.getId())) {
                UserAchievement ua = UserAchievement.builder()
                        .user(user)
                        .achievement(a)
                        .build();
                userAchievementRepository.save(ua);
            }
        }
    }

    @Override
    public int getCurrentValueForCriteria(User user, CriteriaType criteriaType) {
        return switch (criteriaType) {
            case QUIZ_COUNT -> user.getTotalQuizzes();
            case SESSION_COUNT -> user.getSessions() != null ? user.getSessions().size() : 0;
            case SCORE_REACHED -> user.getElo();
            case STREAK_DAYS -> 0; // TODO: Implement streak tracking in User entity
            case QNA_COUNT -> user.getTotalQna();
            case SUMMARY_COUNT -> user.getTotalSummaries();
        };
    }
}
