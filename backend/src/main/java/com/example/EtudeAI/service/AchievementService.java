package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.AchievementDTO;
import com.example.EtudeAI.model.entity.Achievement;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.entity.UserAchievement;
import com.example.EtudeAI.model.enums.CriteriaType;
import com.example.EtudeAI.repository.AchievementRepository;
import com.example.EtudeAI.repository.UserAchievementRepository;
import com.example.EtudeAI.repository.UserRepository;
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
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "achievements", key = "#keycloakUserId")
    public List<AchievementDTO> getUserAchievements(String keycloakUserId) {
        User user = userRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Achievement> allAchievements = achievementRepository.findAll();
        List<UserAchievement> unlocked = userAchievementRepository.findByUserId(user.getId());

        Map<UUID, UserAchievement> unlockedMap = unlocked.stream()
                .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua));

        return allAchievements.stream().map(a -> {
            UserAchievement ua = unlockedMap.get(a.getId());
            return AchievementDTO.builder()
                    .id(a.getId())
                    .name(a.getName())
                    .description(a.getDescription())
                    .icon(a.getIcon())
                    .unlocked(ua != null)
                    .unlockedAt(ua != null ? ua.getUnlockedAt() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "achievements", key = "#user.keycloakUserId")
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
}
