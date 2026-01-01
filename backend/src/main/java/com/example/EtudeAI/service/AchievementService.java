package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.AchievementDTO;
import com.example.EtudeAI.model.entity.User;
import com.example.EtudeAI.model.enums.CriteriaType;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface AchievementService {

    List<AchievementDTO> getUserAchievements(String keycloakUserId);

    void checkAndUnlock(User user, CriteriaType type, int currentValue);

    int getCurrentValueForCriteria(User user, CriteriaType criteriaType);
}
