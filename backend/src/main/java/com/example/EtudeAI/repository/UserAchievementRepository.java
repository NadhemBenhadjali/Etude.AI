package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {
    List<UserAchievement> findByUserId(UUID userId);

    @Query("SELECT CASE WHEN COUNT(ua) > 0 THEN true ELSE false END FROM UserAchievement ua WHERE ua.user.id = :userId AND ua.achievement.id = :achievementId")
    boolean existsByUserIdAndAchievementId(UUID userId, UUID achievementId);
}
